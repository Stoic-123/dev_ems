const con = require('../../config/db');

const getRemainigLeaveDays = async (req, res)  => {
    try {
        const user_id = req.user.id;

        const [remainLeave] = await con.query("SELECT remaining_leave_days FROM tbl_user WHERE user_id = ?", [user_id]);
        
        if(remainLeave.length === 0) {
            return res.status(400).json({ result: false, msg: "Invalid user" });
        }

        res.status(200).json({ 
            result: true, 
            msg: "Remaining leave day fetched successfully",
            remain_leave_day: remainLeave[0].remaining_leave_days
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ result: false, msg: 'Internal server error' });
    }
}

module.exports = {
    getRemainigLeaveDays
}