const jwt = require('jsonwebtoken');
const con = require('../config/db');

const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).json({ result: false, msg: 'You are not logged in. Please log in to continue' });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // Query the database using the pool and await the result
        const [rows] = await con.query(
            `SELECT token_version, role_name 
             FROM tbl_user u 
             JOIN tbl_role r ON u.role_id = r.role_id 
             WHERE u.user_id = ?`, 
            [decodedToken.id]
        );

        if (rows.length === 0) {
            return res.status(401).json({ result: false, msg: 'User not found' });
        }

        const { token_version: userTokenVersion, role_name: userRole } = rows[0];

        // Verify if the token version matches
        if (decodedToken.token_version !== userTokenVersion) {
            return res.status(401).json({ result: false, msg: 'Your session has expired. Please log in again' });
        }

        // Attach user information to the request object
        req.user = decodedToken;
        req.user.role = userRole;

        next();
    } catch (err) {
        console.error("Authorization error:", err);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ result: false, msg: 'Invalid token. Please log in again' });
        }
        res.status(500).json({ result: false, msg: 'Internal server error' });
    }
};

module.exports = {
    requireAuth
};
