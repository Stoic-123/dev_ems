const bcrypt = require('bcrypt');
const moment = require('moment');

const con = require('../../config/db');

const { formatEmpResponse, formatEmployeeSummary } = require('../../services/employee');
const { validator, schemas } = require('../../validation/employee');

// Create a new employee
const createEmployee = async (req, res) => {
    const connection = await con.getConnection();
    await connection.beginTransaction();

    try {
        const body = req.body;
        const { error, value } = validator(schemas.createEmployee)(body);
        if (error) return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });

        const [role, position, employeeType] = await Promise.all([
            con.query("SELECT role_id FROM tbl_role WHERE role_id = ?", [body.role_id]),
            con.query("SELECT position_id, status FROM tbl_position WHERE position_id = ?", [body.position_id]),
            con.query("SELECT employee_type_id FROM tbl_employee_type WHERE employee_type_id = ?", [body.employee_type_id])
        ]);

        if (!role[0].length) return res.status(404).json({ result: false, msg: 'Role not found' });
        if (!position[0].length || position[0][0].status === 'Inactive') {
            return res.status(404).json({ result: false, msg: 'Position is not available' });
        }
        if (!employeeType[0].length) return res.status(404).json({ result: false, msg: 'Employee type not found' });
        
        const [phoneNumber] = await con.query("SELECT 1 FROM tbl_user WHERE phone_number = ?", [body.phone_number]);
        if (phoneNumber.length) return res.status(400).json({ result: false, msg: "Phone number is already in use by another user" });

        let baseUsername = `${body.first_name.toLowerCase()}_${body.last_name.toLowerCase()}`;
        let username = baseUsername;
        const [existingUsernames] = await connection.query(
            "SELECT username FROM tbl_user WHERE username LIKE ? ORDER BY username DESC LIMIT 1",
            [`${baseUsername}%`]
        );
        if (existingUsernames.length) {
            const lastUsername = existingUsernames[0].username;
            const match = lastUsername.match(/_(\d+)$/);
            const nextNumber = match ? parseInt(match[1], 10) + 1 : 1;
            username = `${baseUsername}_${nextNumber}`;
        } else username = baseUsername;

        const currentYear = moment().format('YYYY');
        const [maxCode] = await con.query(
            "SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code, 6) AS UNSIGNED)), 0) + 1 AS next_id FROM tbl_user WHERE employee_code LIKE ?",
            [`${currentYear}-%`]
        );
        const nextId = maxCode[0].next_id;
        const employeeCode = `${currentYear}-${String(nextId).padStart(4, '0')}`;

        const defaultPassword = '123456789';
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(defaultPassword, salt);
        
        const createQuery = `
            INSERT INTO tbl_user 
            (employee_code, role_id, position_id, employee_type_id, first_name, last_name, username, 
            dob, gender, address, phone_number, hired_date, basic_salary, password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const empValues = [
            employeeCode, body.role_id, body.position_id, body.employee_type_id, body.first_name, body.last_name, 
            username, value.dob, body.gender, body.address, body.phone_number, value.hired_date, body.basic_salary, hashPassword
        ];
        const [createResult] = await connection.query(createQuery, empValues);

        await connection.commit();

        res.status(201).json({ 
            result: true, 
            msg: 'Employee created successfully', 
            data: { username, employeeCode } 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Server error:', error);
        return res.status(500).json({ result: false, msg: 'Internal server error' });
    } finally {
        connection.release();
    }
};

// Delete a specific employee by ID
const deleteEmployee = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { error } = validator(schemas.userId)(req.params);
        if (error) return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });

        const [userData] = await con.query(`
            SELECT u.user_id, u.status_id, s.status_name
            FROM tbl_user u
            LEFT JOIN tbl_user_status s ON u.status_id = s.status_id
            WHERE u.user_id = ?`,
            [user_id]
        );

        if (userData.length === 0) return res.status(404).json({ result: false, msg: "Employee not found" });

        const { status_name } = userData[0];

        if (!status_name) return res.status(404).json({ result: false, msg: "Employee status not found" });

        if (status_name === 'Inactive') return res.status(400).json({ result: false, msg: "Employee has already been deactivated" });

        const [updateResult] = await con.query(`
            UPDATE tbl_user 
            SET status_id = (SELECT status_id FROM tbl_user_status WHERE status_name = ?), deleted_at = NOW()
            WHERE user_id = ?`, 
            ['Inactive', user_id]
        );

        if (updateResult.affectedRows === 0) return res.status(404).json({ result: false, msg: "Failed to delete employee" });

        res.status(200).json({ result: true, msg: "Employee has been deactivated" });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
};

// Get all employees with optional status filter (Active or Inactive)
const getListEmployee = async (req, res) => {
    try {
        const { status } = req.query;
        const { error } = validator(schemas.getEmployeeStatus)({ status });
        if (error) return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });

        let selectQuery = `
            SELECT u.username 
            FROM tbl_user u 
            JOIN tbl_user_status s ON u.status_id = s.status_id`;
        if (status) selectQuery += ` WHERE status_name = ?`; 

        const [empRecords] = await con.query(selectQuery, [status].filter(Boolean));

        if (empRecords.length === 0) return res.status(404).json({ result: false, msg: "No employees found" });

        const formattedEmp = empRecords.map((data) => formatEmpResponse(data));

        res.status(200).json({
            result: true,
            msg: "Employees fetched successfully",
            data: formattedEmp
        });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
};

// Search for department by name
const getEmployeeByName = async (req, res) => {
    try {
        const { name, status } = req.query;
        const { error } = validator(schemas.getEmployeeName)({ name, status });
        if (error) return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });

        let selectQuery = `
            SELECT u.user_id, u.username, u.first_name, u.last_name, s.status_name 
            FROM tbl_user u 
            LEFT JOIN tbl_user_status s ON u.status_id = s.status_id
            WHERE u.first_name LIKE ? OR u.last_name LIKE ?`;
        let queryParams = [`%${name}%`, `%${name}%`];

        if (status) {
            selectQuery += ` AND s.status_name = ?`;
            queryParams.push(status);
        }

        const [empRecord] = await con.query(selectQuery, queryParams);

        if (empRecord.length === 0) return res.status(404).json({ result: false, msg: "No employees found" });

        const formattedEmp = empRecord.map(emp => formatEmpResponse(emp));
        return res.status(200).json({ 
            result: true, 
            msg: "Employees fetched successfully",
            data: formattedEmp
        });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
};

// Get a specific employee by ID
const getEmployeeById = async (req, res) => {
    try {
        const { user_id } = req.params; 
        const { error, value } = validator(schemas.userId)(req.params);
        if (error) return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });

        const [empRecord] = await con.query("SELECT * FROM tbl_user WHERE user_id = ?", [user_id]);

        if (empRecord.length === 0) return res.status(404).json({ result: false, msg: "Employee not found" });

        const formattedEmp = formatEmpResponse(empRecord[0]);

        return res.status(200).json({ 
            result: true, 
            msg: "Employee fetched successfully",
            data: formattedEmp
        });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
};

// Update a specific employee personal info
const updateEmployeePersonalInfo = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { first_name, last_name, gender } = req.body;
        const { error, value } = validator(schemas.updateEmployeePersonalInfo)(req.body);
        if (error) {
            return res.status(400).json({ result: false, errors: error.details.map(err => err.message) });
        }

        const [existingUser] = await con.query(`
            SELECT u.first_name, u.last_name, u.username, us.status_name 
            FROM tbl_user u
            JOIN tbl_user_status us ON u.status_id = us.status_id
            WHERE u.user_id = ?`, 
            [user_id]
        );

        if (existingUser.length === 0) return res.status(404).json({ result: false, msg: "User not found" });
        if (existingUser[0].status_name !== "Active") return res.status(403).json({ result: false, msg: "User is deactivated" });

        let username = existingUser[0].username;
        if (first_name !== existingUser[0].first_name || last_name !== existingUser[0].last_name) {
            let baseUsername = `${first_name.toLowerCase()}_${last_name.toLowerCase()}`;
            const [existingUsernames] = await con.query(
                "SELECT username FROM tbl_user WHERE username LIKE ? ORDER BY username DESC LIMIT 1",
                [`${baseUsername}%`]
            );
            if (existingUsernames.length) {
                const lastUsername = existingUsernames[0].username;
                const match = lastUsername.match(/_(\d+)$/);
                const nextNumber = match ? parseInt(match[1], 10) + 1 : 1;
                username = `${baseUsername}_${nextNumber}`;
            } else {
                username = baseUsername;
            }
        }

        const updateQuery = `
            UPDATE tbl_user 
            SET first_name = ?, last_name = ?, username = ?, dob = ?, gender = ?
            WHERE user_id = ?
        `;
        const updateValues = [first_name, last_name, username, value.dob, gender, user_id];
        const [updateResult] = await con.query(updateQuery, updateValues);

        if (updateResult.affectedRows === 0) return res.status(404).json({ result: false, msg: "Failed to update personal info" });

        res.status(200).json({
            result: true, 
            msg: "Personal information updated successfully",
            data: { username }
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
};

// Update a specific employee contact info
const updateEmployeeContactInfo = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { phone_number, address } = req.body;
        const { error, value } = validator(schemas.updateEmployeeContactInfo)(req.body);
        if (error) return res.status(400).json({ result: false, errors: error.details.map(err => err.message) });

        const [existingUser] = await con.query(`
            SELECT u.user_id, u.phone_number, us.status_name
            FROM tbl_user u
            JOIN tbl_user_status us ON u.status_id = us.status_id
            WHERE u.user_id = ?`, 
            [user_id]
        );

        if (existingUser.length === 0) return res.status(404).json({ result: false, msg: "User not found" });
        if (existingUser[0].status_name !== "Active") return res.status(403).json({ result: false, msg: "User is deactivated" });

        if (phone_number !== existingUser[0].phone_number) {
            const [phoneExists] = await con.query(`
                SELECT 1 FROM tbl_user WHERE phone_number = ? AND user_id != ?`, 
                [phone_number, user_id]
            );
            if (phoneExists.length > 0) return res.status(400).json({ result: false, msg: "Phone number is already in use by another user" });
        }

        const updateQuery = `
            UPDATE tbl_user 
            SET phone_number = ?, address = ? 
            WHERE user_id = ?
        `;
        const updateValues = [phone_number, address, user_id];
        const [updateResult] = await con.query(updateQuery, updateValues);

        if (updateResult.affectedRows === 0) return res.status(404).json({ result: false, msg: "Failed to update contact info" });

        res.status(200).json({ result: true, msg: "Contact information updated successfully" });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
};

// Update a specific employee employment info
const updateEmployeeEmploymentInfo = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { position_id, employee_type_id, basic_salary, working_hours_per_week } = req.body;
        const { error, value } = validator(schemas.updateEmployeeEmploymentInfo)(req.body);
        if (error) return res.status(400).json({ result: false, errors: error.details.map(err => err.message) });

        const [existingUser] = await con.query(`
            SELECT u.user_id, u.position_id, u.employee_type_id, u.basic_salary, 
                u.working_hours_per_week,  us.status_name, p.position_name, et.employee_type
            FROM tbl_user u
            JOIN tbl_user_status us ON u.status_id = us.status_id
            LEFT JOIN tbl_position p ON u.position_id = p.position_id
            LEFT JOIN tbl_employee_type et ON u.employee_type_id = et.employee_type_id
            WHERE u.user_id = ?`, [user_id]
        );
        
        if (existingUser.length === 0) return res.status(404).json({ result: false, msg: "User not found" });
        if (existingUser[0].status_name !== "Active") return res.status(403).json({ result: false, msg: "User is deactivated" });

        const [position, employeeType] = await Promise.all([
            con.query("SELECT position_id, position_name, status FROM tbl_position WHERE position_id = ?", [position_id]),
            con.query("SELECT employee_type_id, employee_type FROM tbl_employee_type WHERE employee_type_id = ?", [employee_type_id])
        ]);

        const errors_obj = {};
        const errors_arr = [];
        
        if (!position[0].length || position[0][0].status === 'Inactive') {
            errors_obj.position_id = "Position is not available or inactive.";
            errors_arr.push("Position is not available or inactive.");
        }
        
        if (!employeeType[0].length) {
            errors_obj.employee_type_id = "Employee type not found.";
            errors_arr.push("Employee type not found.");
        }
        
        if (errors_arr.length > 0) return res.status(400).json({ result: false, errors_obj, error_arr: errors_arr });
        
        const historyRecords = [];
        const changed_by = req.user.id;
        const currentPosition = existingUser[0].position_name;
        const currentEmployeeType = existingUser[0].employee_type;
        const currentBasicSalary = existingUser[0].basic_salary;

        if (existingUser[0].position_id !== Number(position_id)) historyRecords.push(["Position", currentPosition, position[0][0].position_name]);
        if (existingUser[0].employee_type_id !== Number(employee_type_id)) historyRecords.push(["Employee Type", currentEmployeeType, employeeType[0][0].employee_type]);
        if (existingUser[0].basic_salary !== basic_salary) historyRecords.push(["Basic Salary", currentBasicSalary, basic_salary]);
        const updateQuery = `
            UPDATE tbl_user 
            SET position_id = ?, employee_type_id = ?, hired_date = ?, basic_salary = ?, working_hours_per_week = ? 
            WHERE user_id = ?
        `;
        const updateValues = [position_id, employee_type_id, value.hired_date, basic_salary, working_hours_per_week, user_id];
        const [updateResult] = await con.query(updateQuery, updateValues);

        if (updateResult.affectedRows === 0) return res.status(404).json({ result: false, msg: "Failed to update employment info" });

        if (historyRecords.length > 0) {
            const historyQuery = `
                INSERT INTO tbl_user_history (user_id, changed_by, change_type, old_value, new_value, effective_date) VALUES ?
            `;
            const historyValues = historyRecords.map(([change_type, old_value, new_value]) => [
                user_id, changed_by, change_type, old_value, new_value, new Date()
            ]);
            await con.query(historyQuery, [historyValues]);
        }        

        res.status(200).json({ result: true, msg: "Employment information updated successfully" });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
};

const getEmployeeSummary = async (req, res) => {
    try {
        const selectQuery = `
            SELECT 
                COUNT(*) AS total_employees,
                SUM(CASE WHEN gender = 'Female' THEN 1 ELSE 0 END) AS total_female,
                SUM(CASE WHEN gender = 'Male' THEN 1 ELSE 0 END) AS total_male,
                SUM(CASE WHEN s.status_name = 'Active' THEN 1 ELSE 0 END) AS total_active,
                SUM(CASE WHEN s.status_name = 'Inactive' THEN 1 ELSE 0 END) AS total_inactive,
                SUM(CASE WHEN gender = 'Male' AND s.status_name = 'Active' THEN 1 ELSE 0 END) AS total_male_active,
                SUM(CASE WHEN gender = 'Male' AND s.status_name = 'Inactive' THEN 1 ELSE 0 END) AS total_male_inactive,
                SUM(CASE WHEN gender = 'Female' AND s.status_name = 'Active' THEN 1 ELSE 0 END) AS total_female_active,
                SUM(CASE WHEN gender = 'Female' AND s.status_name = 'Inactive' THEN 1 ELSE 0 END) AS total_female_inactive
            FROM tbl_user u
            JOIN tbl_user_status s ON u.status_id = s.status_id;
        `;
        const [summary] = await con.query(selectQuery);

        if (!summary || summary.length === 0) return res.status(404).json({ result: false, msg: "No employee data found" });

        const formattedSummary = formatEmployeeSummary(summary[0]);

        res.status(200).json({
            result: true,
            msg: "Employee summary fetched successfully",
            data: formattedSummary
        });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
};

module.exports = {
    createEmployee, 
    deleteEmployee,
    getListEmployee,
    getEmployeeSummary, 
    getEmployeeByName, 
    getEmployeeById,
    updateEmployeePersonalInfo,
    updateEmployeeContactInfo,
    updateEmployeeEmploymentInfo
}