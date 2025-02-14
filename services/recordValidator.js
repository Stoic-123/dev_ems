const con = require('../config/db');

const validateActiveRecord = async (tableName, columnId, valueId, entityName, columnStatus = null, statusActive = null) => {
    try {
        let sql = `SELECT * FROM \`${tableName}\` WHERE \`${columnId}\` = ?`;

        const [rows] = await con.query(sql, [valueId]);

        if (rows.length === 0) {
            throw new Error(`${entityName} not found`);
        }

        if (columnStatus && rows[0][columnStatus] !== statusActive) {
            throw new Error(`${entityName} is not active`);
        }

        return rows[0];
    } catch (error) {
        throw error;
    }
}

const checkRecordExistence = async (tableName, columnId, valueId, entityName) => {
    try {
        const sql = `SELECT COUNT(*) AS count FROM \`${tableName}\` WHERE \`${columnId}\` = ?`;
        const [rows] = await con.query(sql, [valueId]);

        if (rows[0].count === 0) {
            throw new Error(`${entityName} not found`);
        }
    } catch (error) {
        throw error;
    }
}

module.exports = {
    validateActiveRecord, checkRecordExistence
};
