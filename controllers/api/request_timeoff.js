const moment = require("moment");

const con = require("../../config/db");

const { validator, schemas } = require("../../validation/request_timeoff");

const postRequestLeave = async (req, res) => {
  const connection = await con.getConnection(); 
  try {
    await connection.beginTransaction();

    let user_id = req.user.id;
    let body = req.body;
    const { error, value } = validator(schemas.postRequestLeave)(body);
    if (error) {
      return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
    }

    const leaveTypeQuery = "SELECT leave_type FROM tbl_leave_type WHERE leave_type_id = ?";
    const [leaveTypeResult] = await connection.query(leaveTypeQuery, [value.leave_type_id]);

    if (leaveTypeResult.length === 0) {
      return res.status(400).json({ result: false, msg: "Invalid leave type" });
    }

    let totalLeaveDays = 0;
    const startDate = moment(value.start_date);
    const endDate = moment(value.end_date);

    if (value.partial_day) {
      totalLeaveDays = 0.5; 
    } else {
      totalLeaveDays = endDate.diff(startDate, 'days') + 1;
    }

    let attachmentName = null;
    if (req.files && req.files.attachment) {
      let attachmentFile = req.files.attachment;

      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']; 
      const maxSize = 5 * 1024 * 1024;

      if (!allowedTypes.includes(attachmentFile.mimetype)) {
        return res.status(400).json({ result: false, msg: "Invalid file type. Only JPEG, PNG, and PDF files are allowed." });
      }

      if (attachmentFile.size > maxSize) {
        return res.status(400).json({ result: false, msg: "File size exceeds the maximum limit of 5 MB." });
      }

      attachmentName = moment.now() + "_" + attachmentFile.name;
      const uploadPath = "public/upload/attachment/" + attachmentName;

      try {
        await attachmentFile.mv(uploadPath);
      } catch (err) {
        return res.status(500).json({ result: false, msg: "File upload error" });
      }
    }

    const insertQuery = "INSERT INTO `tbl_leave` (`user_id`,`leave_type_id`, `start_date`, `end_date`,  `partial_day`, `reason`, `attachment`) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const insertValues = [user_id, value.leave_type_id, value.start_date, value.end_date, value.partial_day || null, value.reason, attachmentName];
    await connection.query(insertQuery, insertValues);

    await connection.commit();

    res.status(200).json({ 
      result: true, 
      msg: "Leave request submitted successfully" 
    });
  
    const [result] = await con.query(sql, arrData);
    const userQuery = "SELECT first_name, last_name FROM tbl_user WHERE user_id = ?";
    const [userResult] = await con.query(userQuery, [user_id]);

    if (userResult.length > 0) {
      const user = userResult[0];
      const userName = `${user.first_name} ${user.last_name}`;

      const notificationMessage = `${userName} has requested time off from ${start_date} to ${end_date}.`;

      const insertNotificationSql = "INSERT INTO tbl_notification (user_id, message, type) VALUES (?, ?, ?)";
      const [notificationResult] = await connection.query(insertNotificationSql, [user_id, notificationMessage, 'Leave Request']);
      const notificationId = notificationResult.insertId;

      const adminsSql = "SELECT user_id FROM tbl_user WHERE role_id = 1";
      const [admins] = await connection.query(adminsSql);
      const insertAdminNotificationSql = "INSERT INTO tbl_notification_admin (notification_id, admin_id, status) VALUES (?, ?, 'Unread')";
      for (const admin of admins) {
        await connection.query(insertAdminNotificationSql, [notificationId, admin.user_id]);

        // Emit real-time notification **ONLY** to admins
        const io = req.app.get("io"); 
        io.to("admins").emit("new_notification", {
          notification_id: notificationId,
          message: notificationMessage,
          type: "Leave Request",
          created_at: new Date(),
        });
      }
    }

  } catch (error) {
    await connection.rollback();
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  } finally {
    connection.release();
  }
}

module.exports = {
  postRequestLeave
};
