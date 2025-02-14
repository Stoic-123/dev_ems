const con = require('../config/db');

const deductLeaveDays = {
    async updateRemainingLeaveDays() {
        let connection;
        try {
            connection = await con.getConnection();
            await connection.beginTransaction();

            const [countTotalAbsents] = await connection.query("CALL CountTotalAbsents()");
            for (const user of countTotalAbsents[0]) {
                const userId = user.user_id;
                const totalAbsentDays = user.total_absent || 0;

                const updateQuery = "UPDATE tbl_user SET remaining_leave_days = remaining_leave_days - ? WHERE user_id = ?";
                await connection.query(updateQuery, [totalAbsentDays, userId]);
            }

            await connection.commit();
            console.log('Remaining leave days updated successfully.');
        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Error updating remaining leave days:', error);
        } finally {
            if (connection) connection.release();
        }
    }
};

module.exports = deductLeaveDays;