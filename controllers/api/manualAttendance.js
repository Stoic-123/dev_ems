const con = require('../../config/db');

const { processScan } = require('../../services/processScan');
const { combineDateTime } = require('../../utils/combineDateTime');

const { validator, schemas } = require('../../validation/manualAttendance');

const addAttendance = async (req, res) => {
    let connection;
    try {
        const { user_id, date, m_checkin, m_checkout, a_checkin, a_checkout } = req.body;
        const { error } = validator(schemas.addAttendance)(req.body);
        if (error) {
            return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
        }
        
        const m_checkin_time = combineDateTime(date, m_checkin);
        const m_checkout_time = combineDateTime(date, m_checkout);
        const a_checkin_time = combineDateTime(date, a_checkin);
        const a_checkout_time = combineDateTime(date, a_checkout);

        const scans = [
            { type: "m_checkin", time: m_checkin_time },
            { type: "m_checkout", time: m_checkout_time },
            { type: "a_checkin", time: a_checkin_time },
            { type: "a_checkout", time: a_checkout_time }
        ];

        connection = await con.getConnection();
        await connection.beginTransaction();

        const [empResult] = await connection.query("SELECT * FROM tbl_user WHERE user_id = ?", [user_id]);
        if (empResult.length === 0) {
            await connection.rollback(); 
            connection.release(); 
            return res.status(404).json({ result: false, msg: "Employee not found" });
        }

        const [attResult] = await connection.query("SELECT * FROM tbl_attendance WHERE user_id = ? AND date = ?", [user_id, date]);
        let att_id;
        if (attResult.length === 0) {
            const [insertResult] = await connection.query("INSERT INTO tbl_attendance (user_id, date) VALUES (?, ?)", [user_id, date]);
            att_id = insertResult.insertId;
        } else {
            att_id = attResult[0].attendance_id;
        }

        const results = [];
        for (const scan of scans) {
            const result = await processScan(connection, att_id, scan);
            results.push(result);
        }

        await connection.commit();
        connection.release();

        res.status(200).json({ result: true, data: results });
    } catch (error) {
        console.error("Server error:", error);
        if (connection) {
            await connection.rollback();
            connection.release(); 
        }

        res.status(500).json({ result: false, msg: "Internal server error" });
    }
}

const updateAttendance = async (req, res) => {
    try {
        
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
}

const deleteAttendance = async (req, res) => {
    try {
        
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
}

module.exports = {
    addAttendance, updateAttendance, deleteAttendance
}