const con = require('../../config/db');

// const { validator, schemas } = require('../../validation/employeeType');

const createLeaveType = async (req, res) => {
    try {
        const body = req.body;

        // Validate input data
        // const { error, value } = validator(schemas.createEmpType)(body);
        // if (error) {
        //     return res.status(400).json({
        //         result: false,
        //         msg: "Validation errors",
        //         errors: error.details.map((err) => err.message)
        //     });
        // }
        
        const [data] = await con.query("INSERT INTO `tbl_leave_type` (`leave_type`) VALUES (?)", [body.employee_type]);
        return res.status(200).json({ result: true, msg: 'Employee type added successfully' });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ result: false, msg: 'Internal server error' });
    }
}

module.exports = {
    createLeaveType
}