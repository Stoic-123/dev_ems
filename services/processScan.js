const { determineStatus } = require('../utils/determineStatus');

const processScan = async (con, att_id, scan) => {
    if (scan.time) {
        const [existScan] = await con.query("SELECT * FROM tbl_attendance_scan WHERE attendance_id = ? AND scan_type = ?", [att_id, scan.type]);

        const status = determineStatus(scan.time, scan.type);

        if (existScan.length > 0) {
            const updateQuery = "UPDATE tbl_attendance_scan SET scan_time = ?, status = ? WHERE attendance_id = ? AND scan_type = ?";
            await con.query(updateQuery, [scan.time, status, att_id, scan.type]);

            return {
                message: "Scan updated successfully for " + scan.type,
                time: scan.time,
            };
        } else {
            const insertQuery = "INSERT INTO tbl_attendance_scan (attendance_id, scan_type, scan_time, status) VALUES (?, ?, ?, ?)";
            await con.query(insertQuery, [att_id, scan.type, scan.time, status]);

            return {
                message: "Scan recorded successfully for " + scan.type,
                time: scan.time,
            };
        }
    } else {
        return {
            message: "No scan provided for " + scan.type,
            time: null,
        };
    }
}

module.exports = {
    processScan
}
