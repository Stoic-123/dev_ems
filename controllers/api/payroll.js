const db = require('../../config/db');
const cron = require('node-cron');
const {validator,schemas}=require('../../validation/payroll')
const moment = require('moment'); // Import moment.js

const runPayroll = async () => {
    try {
        const currentDate = new Date();
        const pay_period_start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const pay_period_end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const pay_date = new Date(pay_period_end);
        pay_date.setDate(pay_date.getDate() + 5);

        const [users] = await db.query('SELECT * FROM tbl_user');

        for (const user of users) {
            const { user_id, salary_id } = user;

            const [salaryRecord] = await db.query('SELECT salary_amount FROM tbl_salary WHERE salary_id = ?', [salary_id]);
            if (!salaryRecord.length) continue;

            const base_salary = salaryRecord[0].salary_amount;

            const [earnings] = await db.query(
                'SELECT amount FROM tbl_salary_components WHERE component_type = "EARNING" AND user_id = ?',
                [user_id]
            );
            const totalEarnings = earnings.reduce((sum, comp) => sum +Number(comp.amount), 0);

            const [deductions] = await db.query(
                'SELECT amount FROM tbl_salary_components WHERE component_type = "DEDUCTION" AND user_id = ?',
                [user_id]
            );
            const totalDeductions = deductions.reduce((sum, comp) => sum + Number(comp.amount), 0);

            const grossSalary = Number(base_salary) + Number(totalEarnings);
            console.log(totalDeductions,":",totalEarnings)
             // Calculate Tax
             const calculateTax = (grossSalary) => {
                let tax = 0;
                let exchangeRate = 4000;
                grossSalary = grossSalary * exchangeRate;
                if (grossSalary <= 1500000) {
                    tax = 0; // No tax
                } else if (grossSalary <= 2000000) {
                    tax = (grossSalary - 1500000) * 0.05;
                } else if (grossSalary <= 8500000) {
                    tax = (2000000 - 1500000) * 0.05 + (grossSalary - 2000000) * 0.1; 
                } else if (grossSalary <= 12500000) {
                    tax = (2000000 - 1500000) * 0.05 + (8500000 - 2000000) * 0.1 + (grossSalary - 8500000) * 0.15; 
                } else {
                    tax = (2000000 - 1500000) * 0.05 + (8500000 - 2000000) * 0.1 + (12500000 - 8500000) * 0.15 + (grossSalary - 12500000) * 0.2; 
                }
                return tax / exchangeRate;
            };
            const tax = calculateTax(grossSalary);
            const totalTaxDeductions = tax;
            const netSalary = grossSalary - (totalDeductions + totalTaxDeductions);

            const [existingRecord] = await db.query(
                'SELECT * FROM tbl_payroll_records WHERE user_id = ? AND pay_period_start = ? AND pay_period_end = ?',
                [user_id, pay_period_start, pay_period_end]
            );

            if (existingRecord.length > 0) {
                await db.query(
                    'UPDATE tbl_payroll_records SET gross_salary = ?, total_deductions = ?, net_salary = ?, pay_date = ?, status = ? WHERE user_id = ? AND pay_period_start = ? AND pay_period_end = ?',
                    [grossSalary, totalDeductions + totalTaxDeductions, netSalary, pay_date, 'PENDING', user_id, pay_period_start, pay_period_end]
                );
            } else {
                await db.query(
                    'INSERT INTO tbl_payroll_records (user_id, pay_period_start, pay_period_end, gross_salary, total_deductions, net_salary, pay_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [user_id, pay_period_start, pay_period_end, grossSalary, totalDeductions + totalTaxDeductions, netSalary, pay_date, 'PENDING']
                );
            }
        }

        console.log('Payroll records processed successfully');
    } catch (err) {
        console.error('Error processing payroll:', err.message);
    }
};


const postRecordPayroll = async (req, res) => {
    await runPayroll();
    res.status(200).json({ message: 'Payroll records processed successfully' });
};


cron.schedule('0 0 * * *', () => {
    console.log('Running payroll job at 00:00 AM...');
    runPayroll(); // No req, res needed
});


const getPayrollRecords = async (req, res) => {
    try {
        let query = 'SELECT * FROM tbl_payroll_records';

        const [records] = await db.query(query);

        // Format date fields using moment
        const formattedRecords = records.map(record => ({
            ...record,
            pay_period_start: moment(record.pay_period_start).format('DD-MM-YYYY'), 
            pay_period_end: moment(record.pay_period_end).format('DD-MM-YYYY'), 
            pay_date: moment(record.pay_date).format('DD-MM-YYYY'), 
            created_at: moment(record.created_at).format('DD-MM-YYYY HH:mm:ss'),  
            updated_at: moment(record.updated_at).format('DD-MM-YYYY HH:mm:ss'),  
        }));

        res.status(200).json(formattedRecords); // Send formatted records
        console.log(formattedRecords); // Log formatted records
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updatePayrollStatus = async (req, res) => {
    try {
        const { error, value } = validator(schemas.updatedPayrollStatus)(req.body);
        if (error) {
            return res.status(400).json({
            result: false,
            msg: "Validation errors",
            errors: error.details.map((err) => err.message),
            });
        }
   
        const { user_id , status } = req.body;
        // Get user_id linked to the payroll record
        const [payrollRecord] = await db.query(
            'SELECT payroll_id FROM tbl_payroll_records WHERE user_id = ?',
            [user_id]
        );

        if (payrollRecord.length === 0) {
            return res.status(404).json({ message: 'Payroll record not found' });
        }

        const payroll_id = payrollRecord[0].payroll_id;

        // Update payroll status
        await db.query(
            'UPDATE tbl_payroll_records SET status = ? WHERE payroll_id = ?',
            [status, payroll_id]
        );

        // If status is "PAID", delete salary components for that user
        if (status === "PAID") {
            await db.query(
                'DELETE FROM tbl_salary_components WHERE user_id = ?',
                [user_id]
            );
            console.log('Salary components deleted for user_id:', user_id);
        }
        res.status(200).json({ message: 'Payroll status updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getPaySlip = async (req, res) => {
    try {
        const user_id = req.params.id;

        // Fetch payroll record
        const [paySlip] = await db.query(
            'SELECT * FROM tbl_payroll_records WHERE user_id = ? ORDER BY pay_period_end DESC LIMIT 1',
            [user_id]
        );

        if (paySlip.length === 0) {
            return res.status(404).json({ message: "No pay slip found for the user" });
        }

        // Fetch salary components (earnings and deductions)
        const [earnings] = await db.query(
            'SELECT * FROM tbl_salary_components WHERE component_type = "EARNING" AND user_id = ?',
            [user_id]
        );
        const [deductions] = await db.query(
            'SELECT * FROM tbl_salary_components WHERE component_type = "DEDUCTION" AND user_id = ?',
            [user_id]
        );

        const formattedPaySlip = paySlip.map(paySlip => ({
            ...paySlip,
            pay_period_start: moment(paySlip.pay_period_start).format('DD-MM-YYYY'), 
            pay_period_end: moment(paySlip.pay_period_end).format('DD-MM-YYYY'), 
            pay_date: moment(paySlip.pay_date).format('DD-MM-YYYY'), 
            created_at: moment(paySlip.created_at).format('DD-MM-YYYY HH:mm:ss'),  
            updated_at: moment(paySlip.updated_at).format('DD-MM-YYYY HH:mm:ss'),  
        }));

        const response = {
            paySlip: formattedPaySlip[0],
            earnings,
            deductions,
        };

        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



module.exports = { postRecordPayroll, getPayrollRecords, updatePayrollStatus ,getPaySlip};

