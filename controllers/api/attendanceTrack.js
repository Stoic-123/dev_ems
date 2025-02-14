const con = require('../../config/db');

const { formatAttResponse } = require('../../services/attendanceTrack');
const { validator, schemas } = require('../../validation/attendanceTrack');

const getAttendanceRecord = async (req, res) => {
    try {
        const { date, department_id } = req.body;

        const { error, value } = validator(schemas.getAttendanceRecord)({ date });
        if (error) {
            return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
        }

        const [attRecordResult] = await con.query('CALL GetAttendanceRecord(?, ?)', [date, department_id]);
       
        if(attRecordResult.length === 0) {
            return res.status(404).json({ result: false, msg: 'No attendance record'});
        }

        const formarttedAttRecord = attRecordResult[0].map((record) => formatAttResponse(record));

        return res.status(200).json({
            result: true,
            msg: 'Fetched attendance records successfully',
            data: formarttedAttRecord
        });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
}

const getAttendanceSummary = async (req, res) => {
    try {
        const totalEmpQuery = `
            SELECT COUNT(user_id) AS total_emp FROM tbl_user
        `;
        const [totalEmpResult] = await con.query(totalEmpQuery);

        if(totalEmpQuery.length === 0) {
            return res.status(404).json({ result: false, msg: 'No Data'});
        }

        const summaryAttQuery = `
            SELECT COUNT(DISTINCT a.user_id) AS total_present
            FROM tbl_attendance a
            JOIN tbl_attendance_scan s ON a.attendance_id = s.attendance_id
            WHERE a.date = ?
        `;
        const [summaryAttResult] = await con.query(summaryAttQuery, ['2025-01-26']);

        if(summaryAttResult.length === 0) {
            return res.status(404).json({ result: false, msg: 'No attendance record'});
        }

        const formattedSummary = {
            totalEmp: totalEmpResult[0].total_emp,
            totalPresent: summaryAttResult[0].total_present,
            totalAbsent: totalEmpResult[0].total_emp - summaryAttResult[0].total_present,
        };

        return res.status(200).json({
            result: true,
            msg: 'Fetched attendance summary successfully',
            data: formattedSummary,
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
}

module.exports = {
    getAttendanceRecord, getAttendanceSummary
};