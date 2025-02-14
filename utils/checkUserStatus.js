const con = require('../config/db'); 

const checkUserStatus = async (user_id) => {
    const [existingUser] = await con.query(`
        SELECT u.user_id, us.status_name
        FROM tbl_user u
        JOIN tbl_user_status us ON u.status_id = us.status_id
        WHERE u.user_id = ?`, 
        [user_id]
    );

    if (existingUser.length === 0) throw new Error('User not found');
    if (existingUser[0].status_name !== "Active") throw new Error('User is deactivated');

    return existingUser[0];
};

module.exports = {
    checkUserStatus
};
