const con = require('../../config/db');

const { formatPersonalAttResponse, formatPersonalAttStatResponse, processAttendanceData, formatComparisonResponse } = require('../../services/personalAttendance');
const { validator, schemas } = require('../../validation/personalAttendance');
const { determineDateRange, calculateDateRangeDays, getPreviousDateRange } = require('../../utils/dateHelper');

const getPersonalAttendanceToday = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { error } = validator(schemas.getPersonalAttendanceToday)({ user_id });
        if (error) {
            return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
        }

        const [attendanceRecords] = await con.query('CALL GetPersonalAttendanceToday(?)', [user_id]);

        if (!attendanceRecords[0] || Object.values(attendanceRecords[0][0]).every(value => value === null)) {
            return res.status(404).json({ result: false, msg: 'No attendance data found for today' });
        }

        const formattedRecords = formatPersonalAttResponse(attendanceRecords[0][0]);

        return res.status(200).json({
            result: true,
            msg: 'Today\'s attendance data fetched successfully',
            data: formattedRecords,
        });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
}

const getPersonalAttendance = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { emp_id, start_date, end_date } = req.query;

        const validationData = { emp_id: emp_id, start_date, end_date };
        const { error, value } = validator(schemas.getPersonalAttendance)(validationData);
        if (error) {
            return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
        }

        const finalDates = determineDateRange(value.start_date, value.end_date);
        const finalQueryData = { emp_id: value.emp_id, ...finalDates };
        const idToQuery = (req.user.role === 'Admin' && finalQueryData.emp_id) ? finalQueryData.emp_id : user_id;

        const [attendanceRecords] = await con.query(
            "CALL GetPersonalAttendance(?, ?, ?)", 
            [idToQuery, finalQueryData.start_date, finalQueryData.end_date]
        );

        const completeRecords = processAttendanceData(
            finalDates.start_date,
            finalDates.end_date,
            attendanceRecords[0] || []
        );

        const formattedRecords = completeRecords.map(record => formatPersonalAttResponse(record));

        return res.status(200).json({
            result: true,
            msg: 'Attendance record fetched successfully',
            data: formattedRecords,
        });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
}

const getPersonalAttendanceStats = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { emp_id, start_date, end_date } = req.query;

        const validationData = { emp_id, start_date, end_date };
        const { error, value } = validator(schemas.getPersonalAttendance)(validationData);
        if (error) {
            return res.status(400).json({ result: false, errors: error.details.map((err) => err.message),
            });
        }

        // Determine current date range
        const curDates = determineDateRange(value.start_date, value.end_date);
        const curQueryData = { emp_id: value.emp_id, ...curDates };
        const idToQuery = (req.user.role === 'Admin' && curQueryData.emp_id) ? curQueryData.emp_id : user_id;
        const totalDaysInRange = calculateDateRangeDays(curQueryData.start_date, curQueryData.end_date);

        // Determine previous date range
        const prevDates = getPreviousDateRange(curQueryData.start_date, curQueryData.end_date);
        const prevQueryData = { emp_id: value.emp_id, ...prevDates };
        const totalPreviousDays = calculateDateRangeDays(prevQueryData.start_date, prevQueryData.end_date);

        // Fetch current attendance records from the database
        const [curRecords] = await con.query("CALL GetPersonalAttendanceStats(?, ?, ?)", [
            idToQuery, curQueryData.start_date, curQueryData.end_date
        ]);

        if (!curRecords || !curRecords[0] || !curRecords[0][0]) {
            return res.status(404).json({ result: false, msg: "No attendance records found" });
        }

        // Fetch current attendance records from the database
        const [prevRecords] = await con.query("CALL GetPersonalAttendanceStats(?, ?, ?)", [
            idToQuery, prevQueryData.start_date, prevQueryData.end_date
        ]);

        // Format current responses
        const curFormat = formatPersonalAttStatResponse(
            curRecords[0][0], totalDaysInRange, curQueryData.start_date, curQueryData.end_date
        );

        // Format previous responses
        const prevFormat = formatPersonalAttStatResponse(
            prevRecords[0][0], totalPreviousDays, prevQueryData.start_date, prevQueryData.end_date
        );

        const compareFormat = formatComparisonResponse(curFormat, prevFormat);

        return res.status(200).json({
            result: true, 
            msg: "Attendance statistics fetched successfully", 
            curData: curFormat,
            // prevPeriod: prevFormat,
            compareData: compareFormat
        });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            result: false,
            msg: "Internal server error",
        });
    }
}

module.exports = {
    getPersonalAttendance, getPersonalAttendanceStats, getPersonalAttendanceToday
};