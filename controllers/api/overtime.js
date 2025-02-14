const { validateOvertimeRequest } = require("../../validation/overtime");
const moment = require("moment");
const con = require("../../config/db");

const requestOvertime = async (req, res) => {
    const { request_date, reason, start_time, end_time } = req.body;
    const user_id = req.user.id;

    // Validate the input data
    const { error } = validateOvertimeRequest(req.body);
    if (error) {
        return res.status(400).json({ result: false, msg: error.details.map(e => e.message).join(', ') });
    }

    try {
        // Convert the input time from 12-hour format to 24-hour format
        const formattedStartTime = moment(start_time, "hh:mm A").format("HH:mm:ss");
        const formattedEndTime = moment(end_time, "hh:mm A").format("HH:mm:ss");

        // Insert the converted time into the database
        const sql = `INSERT INTO tbl_overtime (user_id, request_date, reason, start_time, end_time) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await con.query(sql, [user_id, request_date, reason, formattedStartTime, formattedEndTime]);

        if (result.affectedRows > 0) {
            // Fetch the user's name for the notification message
            const userQuery = "SELECT first_name, last_name FROM tbl_user WHERE user_id = ?";
            const [userResult] = await con.query(userQuery, [user_id]);
            const user = userResult[0];
            const userName = `${user.first_name} ${user.last_name}`;

            // Create a notification message (displaying time in 12-hour format)
            const notificationMessage = `
                ${userName} has requested overtime from ${start_time} to ${end_time}.
            `;

            // Insert the notification into the database
            const insertNotificationSql = `
                INSERT INTO tbl_notification (user_id, message, type)
                VALUES (?, ?, ?)
            `;
            const [notificationResult] = await con.query(insertNotificationSql, [user_id, notificationMessage, 'Overtime Request']);
            const notificationId = notificationResult.insertId;

            // Notify admins via WebSocket
            const adminsSql = "SELECT user_id FROM tbl_user WHERE role_id = 1";
            const [admins] = await con.query(adminsSql);

            const insertAdminNotificationSql = `
                INSERT INTO tbl_notification_admin (notification_id, admin_id, status)
                VALUES (?, ?, 'Unread')
            `;
            for (const admin of admins) {
                await con.query(insertAdminNotificationSql, [notificationId, admin.user_id]);
                const io = req.app.get("io");
                io.to("admins").emit("new_notification", {
                    notification_id: notificationId,
                    message: notificationMessage,
                    type: "Overtime Request",
                    created_at: new Date(),
                });
            }

            return res.status(201).json({ result: true, msg: "Overtime request submitted successfully." });
        } else {
            return res.status(500).json({ result: false, msg: "Failed to submit overtime request." });
        }
    } catch (error) {
        console.error("Error submitting overtime request:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
};
const displayOvertime = async (req, res) => {
    try {
        const user_id = req.user.id;

        const ratesSql = `
            SELECT normal_day_rate, holiday_rate
            FROM tbl_overtime_rates
            ORDER BY created_at DESC
            LIMIT 1;
        `;
        const [rates] = await con.query(ratesSql);

        if (rates.length === 0) {
            return res.status(500).json({ result: false, msg: "No overtime rates found." });
        }

        const { normal_day_rate, holiday_rate } = rates[0];

        const sql = `
            SELECT
                request_date,
                TIMESTAMPDIFF(HOUR, start_time, end_time) AS hours,
                action_status,
                reason,
                overtime_type
            FROM tbl_overtime
            WHERE user_id = ?;
        `;

        const [data] = await con.query(sql, [user_id]);

        if (data.length === 0) {
            return res.status(200).json({ msg: "No data existing in table" });
        }

        data.forEach(item => {
            const rate = item.overtime_type === 'Holiday' ? holiday_rate : normal_day_rate;
            item.overtime_pay = `$${(item.hours * rate).toFixed(2)}`;
        });

        res.status(200).json({ result: true, data: data });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
};
const detailOvertime = async (req, res) => {
    const { overtime_id } = req.params;
    const ratesSql = `
    SELECT normal_day_rate, holiday_rate
    FROM tbl_overtime_rates
    ORDER BY created_at DESC
    LIMIT 1;
`;
    const [rates] = await con.query(ratesSql);

    if (rates.length === 0) {
        return res.status(500).json({ result: false, msg: "No overtime rates found." });
    }

    const { normal_day_rate, holiday_rate } = rates[0];

    const sql = `
                SELECT 
                    request_date,
                    TIMESTAMPDIFF(HOUR, start_time, end_time) AS hours,
                    action_status,
                    reason
                FROM tbl_overtime
                WHERE
                    overtime_id =?

    `;
    const [data] = await con.query(sql, [overtime_id])
    if (data.length === 0) {
        return res.status(200).json({ msg: "No data existing in table" });
    }
    data.forEach(item => {
        const rate = item.overtime_type === 'Holiday' ? holiday_rate : normal_day_rate;
        item.overtime_pay = `$${(item.hours * rate).toFixed(2)}`;
    });
    res.status(200).json({ result: true, data: data });
}
// ======================== For admin controll ===========================
const displayAllOvertimeRequest = async (req, res) => {
    const { action_status } = req.params;
    const ratesSql = `
    SELECT normal_day_rate, holiday_rate
    FROM tbl_overtime_rates
    ORDER BY created_at DESC
    LIMIT 1;
`;
    const [rates] = await con.query(ratesSql);

    if (rates.length === 0) {
        return res.status(500).json({ result: false, msg: "No overtime rates found." });
    }

    const { normal_day_rate, holiday_rate } = rates[0];

    try {
        const sql = `
            SELECT 
                ot.overtime_id,
                u.first_name,
                u.last_name,
                u.avatar, 
                d.department_name,
                p.position_name,
                ot.request_date,
                DATE_FORMAT(ot.start_time, '%h:%i %p') AS start_time,
                DATE_FORMAT(ot.end_time, '%h:%i %p') AS end_time,
                ot.action_status,
                ot.overtime_type,
                ot.reason,
                TIMESTAMPDIFF(HOUR, ot.start_time, ot.end_time) AS hours
            FROM tbl_overtime ot
            JOIN tbl_user u ON ot.user_id = u.user_id
            JOIN tbl_position p ON u.position_id = p.position_id
            JOIN tbl_department d ON p.department_id = d.department_id
            WHERE ot.action_status = ?`;

        const [data] = await con.query(sql, [action_status]);

        if (data.length === 0) {
            return res.status(200).json({ msg: "No overtime requests found for this status." });
        }

        data.forEach(item => {
            const rate = item.overtime_type === 'Holiday' ? holiday_rate : normal_day_rate;
            item.overtime_pay = `$${(item.hours * rate).toFixed(2)}`;
        });

        res.status(200).json({ result: true, data });
    } catch (error) {
        console.error("Error filtering overtime requests:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
};


const controllOvetimeRequest = async (req, res) => {
    try {
        const id = req.user.id
        const { overtime_id } = req.params;
        const { action_status, overtime_type } = req.body;

        const sql = `
            UPDATE tbl_overtime 
            SET action_status = ?, overtime_type = ?
            WHERE overtime_id = ?
        `;
        const [data] = await con.query(sql, [action_status, overtime_type, overtime_id]);

        if (data.affectedRows === 0) {
            return res.status(404).json({ result: false, msg: "Overtime request not found." });
        }

        const userQuery = "SELECT first_name, last_name FROM tbl_user WHERE user_id = ?";
        const [userResults] = await con.query(userQuery, [id]);
        console.log(data);
        console.log(userResults[0]);


        if (!userResults.length) {
            return res.status(404).json({ result: false, msg: "User not found." });
        }

        const userData = userResults[0];
        const userName = `${userData.first_name} ${userData.last_name}`;

        const userSql = "SELECT user_id FROM tbl_overtime WHERE overtime_id = ?";
        const [userResult] = await con.query(userSql, [overtime_id]);

        if (userResult.length === 0) {
            return res.status(404).json({ result: false, msg: "Overtime requester not found." });
        }

        const user_id = userResult[0].user_id;
        console.log(user_id);
        const notificationMessage = `Your overtime request has been updated to status: ${action_status}.`;
        console.log(notificationMessage);

        const insertNotificationSql = `
            INSERT INTO tbl_announcement (title, content, created_by)
            VALUES (?, ?, ?)
        `;
        const [insertResult] = await con.query(insertNotificationSql, [action_status, notificationMessage, req.user.id]);
        const announcementId = insertResult.insertId;
        console.log(action_status);

        const userList = "SELECT user_id FROM tbl_user WHERE user_id=?";
        const [users] = await con.query(userList, [user_id]);

        const insertUserAnnouncementSql = `
            INSERT INTO tbl_announcement_user (announcement_user_id, user_id, status)
            VALUES (?, ?, 'Unread')
        `;

        for (const user of users) {
            await con.query(insertUserAnnouncementSql, [announcementId, user.user_id]);
            const io = req.app.get("io");
            const userRoom = `user_${user.user_id}`;
            io.to(userRoom).emit("assign_ot_announcement", {
                notification_id: announcementId,
                title: action_status,
                content: notificationMessage,
                announcement_by: userName,
                created_at: new Date(),
            });
        }

        return res.status(200).json({ result: true, msg: "Overtime request updated successfully." });
    } catch (error) {
        console.error("Error updating overtime request:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
};



const viewDetailOvertimeRequest = async (req, res) => {
    try {
        const { overtime_id } = req.params;
        const ratesSql = `
        SELECT normal_day_rate, holiday_rate
        FROM tbl_overtime_rates
        ORDER BY created_at DESC
        LIMIT 1;
    `;
        const [rates] = await con.query(ratesSql);

        if (rates.length === 0) {
            return res.status(500).json({ result: false, msg: "No overtime rates found." });
        }

        const { normal_day_rate, holiday_rate } = rates[0];
        const sql = `
                     SELECT 
                        ot.overtime_id,
                        u.first_name,
                        u.last_name,
                        u.avatar, 
                        d.department_name,
                        p.position_name,
                        TIMESTAMPDIFF(HOUR, ot.start_time, ot.end_time) AS hours,
                        ot.request_date,
                        DATE_FORMAT(ot.start_time, '%h:%i %p') AS start_time,
                        DATE_FORMAT(ot.end_time, '%h:%i %p') AS end_time,
                        ot.action_status,
                        ot.overtime_type
                    FROM tbl_overtime ot
                    JOIN tbl_user u ON ot.user_id = u.user_id
                    JOIN tbl_position p ON u.position_id = p.position_id
                    JOIN tbl_department d ON p.department_id = d.department_id
                    WHERE overtime_id =?
        `;
        const [data] = await con.query(sql, [overtime_id]);
        if (data[0].length === 0) {
            return res.status(200).json({ msg: "No overtime requests found for this status." });
        }
        data.forEach(item => {
            const rate = item.overtime_type === 'Holiday' ? holiday_rate : normal_day_rate;
            item.overtime_pay = `$${((item.hours) * rate).toFixed(2)}`;
        });
        res.status(200).json({ result: true, data: data });
    } catch (error) {
        console.error("Error filtering overtime requests:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
}
//=======================================
const assignOvertime = async (req, res) => {
    const { user_id, request_date, overtime_type, start_time, end_time, reason } = req.body;

    // Validate the input data
    const { error } = validateOvertimeRequest({ request_date, overtime_type, start_time, end_time, reason });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message).join(", ");
        return res.status(400).json({ result: false, msg: errorMessages });
    }

    try {
        // Convert the input time from 12-hour format to 24-hour format
        const formattedStartTime = moment(start_time, "hh:mm A").format("HH:mm:ss");
        const formattedEndTime = moment(end_time, "hh:mm A").format("HH:mm:ss");

        // Insert the formatted time into the database
        const insertOvertimeSql = `
            INSERT INTO tbl_overtime (user_id, request_date, overtime_type, reason, start_time, end_time, action_status) 
            VALUES (?, ?, ?, ?,?, ?, 'Assigned')
        `;
        const [result] = await con.query(insertOvertimeSql, [user_id, request_date, overtime_type, reason, formattedStartTime, formattedEndTime]);

        if (result.affectedRows > 0) {
            // Fetch the employee's name for the notification message
            const userQuery = "SELECT first_name, last_name FROM tbl_user WHERE user_id = ?";
            const [userResult] = await con.query(userQuery, [user_id]);
            const employee = userResult[0];
            const employeeName = `${employee.first_name} ${employee.last_name}`;

            // Create a notification message (displaying time in 12-hour format)
            const notificationMessage = `${employeeName} has been assigned overtime from ${start_time} to ${end_time}.`;

            // Insert the notification into the database
            const insertNotificationSql = `
                INSERT INTO tbl_announcement (title, content, created_by)
                VALUES (?, ?, ?)
            `;
            const [notificationResult] = await con.query(insertNotificationSql, ['Overtime Assignment', notificationMessage, user_id]);
            const notificationId = notificationResult.insertId;

            // Notify the user via WebSocket
            const userSql = "SELECT user_id FROM tbl_user WHERE user_id=?";
            const [users] = await con.query(userSql, [user_id]);

            const insertUserNotificationSql = `
                INSERT IGNORE INTO tbl_announcement_user (announcement_user_id, user_id, status)
                VALUES (?, ?, 'Unread')
            `;
            for (const user of users) {
                await con.query(insertUserNotificationSql, [notificationId, user.user_id]);
                const io = req.app.get("io");
                const userRoom = `user_${user.user_id}`;
                io.to(userRoom).emit("assign_ot_announcement", {
                    notification_id: notificationId,
                    title: 'Overtime Assignment',
                    content: notificationMessage,
                    announcement_by: 'Admin',
                    created_at: new Date(),
                });
            }

            return res.status(201).json({ result: true, msg: "Overtime assigned successfully." });
        } else {
            return res.status(500).json({ result: false, msg: "Failed to assign overtime." });
        }
    } catch (error) {
        console.error("Error assigning overtime:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
};
const createOvertimeRates = async (req, res) => {
    try {
        const { normal_day_rate, holiday_rate } = req.body;
        const sql = `
                INSERT INTO tbl_overtime_rates(normal_day_rate,holiday_rate) VALUES(?,?)
    `;
        const [data] = await con.query(sql, [normal_day_rate, holiday_rate]);
        if (data.affectedRows) {
            return res.status(201).json({ result: true, msg: "Overtime rates created successfully." });
        } else {
            return res.status(500).json({ result: false, msg: "Failed to create overtime rates." });
        }
    } catch (error) {
        console.error("Error assigning overtime:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
}
const updateOvertimeRates = async (req, res) => {
    try {
        const { rate_id } = req.params;
        const { normal_day_rate, holiday_rate } = req.body;
        const sql = `
                UPDATE tbl_overtime_rates SET normal_day_rate =?, holiday_rate=? WHERE rate_id=?
     `;
        const [data] = await con.query(sql, [normal_day_rate, holiday_rate, rate_id]);
        if (data.affectedRows) {
            return res.status(201).json({ result: true, msg: "Overtime rates Updated successfully." });
        } else {
            return res.status(500).json({ result: false, msg: "Failed to Update overtime rates." });
        }
    } catch (error) {
        console.error("Error assigning overtime:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
}

module.exports = {
    requestOvertime,
    displayOvertime,
    detailOvertime,
    displayAllOvertimeRequest,
    controllOvetimeRequest,
    viewDetailOvertimeRequest,
    assignOvertime,
    createOvertimeRates,
    updateOvertimeRates
};
