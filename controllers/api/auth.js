const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');

const con = require('../../config/db');
const { validator, schemas } = require('../../validation/auth');

const generateToken = (id, token_version) => {
    try {
        const payload = { id, token_version };
        return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '3d'});
    } catch (error) {
        console.error('Error generating token:', error);
        throw new Error('Token generation failed');
    }
}

const loginPost = async (req, res) => {
    try {
        const body = req.body;
        const { error } = validator(schemas.login)(body);
        if (error) return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });

        const selectQuery = `
            SELECT u.user_id, u.username, u.password, u.token_version, u.last_login, 
            r.role_id, r.role_name, us.status_id, us.status_name
            FROM tbl_user u
            JOIN tbl_role r ON u.role_id = r.role_id
            JOIN tbl_user_status us ON u.status_id = us.status_id
            WHERE u.username = ?;
        `;
        const [userData] = await con.query(selectQuery, [body.username]);

        if (userData.length === 0) return res.status(400).json({ result: false, msg: 'User is invalid' });
        const userRecord = userData[0];
        if (userData[0].status_name === 'Inactive') return res.status(400).json({ result: false, msg: 'User is deactivated' });

        const isPasswordValid = await bcrypt.compare(body.password, userRecord.password);
        if (!isPasswordValid) return res.status(401).json({ result: false, msg: 'Password is invalid' });

        const needChangePassword = userRecord.token_version === 1;

        const updatedTokenVersion = userRecord.token_version + 1;
        const updateQuery = "UPDATE tbl_user SET token_version = ?, last_login = NOW() WHERE user_id = ?";
        await con.query(updateQuery, [updatedTokenVersion, userRecord.user_id]);

        const [updatedUserData] = await con.query("SELECT last_login FROM tbl_user WHERE user_id = ?", [userRecord.user_id]);

        const authToken = generateToken(userRecord.user_id, updatedTokenVersion);

        res.cookie('jwt', authToken, { maxAge: 3 * 24 * 60 * 60 * 1000, httpOnly: true });

        return res.status(200).json({
            result: true,
            msg: 'Logged in successfully',
            data: {
                newTokenVersion: updatedTokenVersion,
                needChangePassword,
                token: authToken,
                last_login: moment(updatedUserData[0].last_login).format("YYYY-MM-DD HH:mm:ss"),
                data: {
                    user_id: userRecord.user_id,
                    username: userRecord.username,
                    role: {
                        role_id: userRecord.role_id,
                        role_name: userRecord.role_name,
                    },
                    status: {
                        status_id: userRecord.status_id,
                        status_name: userRecord.status_name,
                    }
                },
            },
        });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ result: false, msg: 'Internal server error' });
    }
}

const logout = (req, res) => {
    res.cookie('jwt', '', { maxAge: 0, httpOnly: true });
    res.status(200).json({ result: true, msg: 'Logged out successfully' });
}

const resetPassword = async (req, res) => {
    try {
        const body = req.body;
        const { error } = validator(schemas.resetPassword)(body);
        if (error) {
            return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
        }

        // Check if the user exists
        const [userData] = await con.query("SELECT * FROM `tbl_user` WHERE `username` = ?", [body.username]);
        if (userData.length === 0) {
            return res.status(404).json({ result: false, msg: "Invalid username" });
        }

        // Reset the password
        const defaultPassword = '123456789';
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(defaultPassword, salt);

        await con.query("UPDATE `tbl_user` SET `password` = ? WHERE `username` = ?", [hashPassword, body.username]);

        return res.status(200).json({ result: true, msg: "Reseted password successfully" });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ result: false, msg: 'Internal server error' });
    }
}

const changePassword = async (req, res) => {
    try {
        const user_id = req.user.id; 
        const body = req.body; 
        body.user_id = user_id;
        const { error } = validator(schemas.changePassword)(body);
        if (error) {
            return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
        }

        // Get the current password
        const [userData] = await con.query("SELECT `password` FROM `tbl_user` WHERE `user_id` = ?", [user_id]);
        if (userData.length === 0) {
            return res.status(404).json({ result: false, msg: "Invalid user" });
        }

        const isPasswordMatch = await bcrypt.compare(body.current_password, userData[0].password);
        if (!isPasswordMatch) {
            return res.status(401).json({ result: false, msg: "Incorrect current password" });
        }

        // Update the password and increment token version
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(body.new_password, salt);

        const updateQuery = `
            UPDATE tbl_user 
            SET password = ?, token_version = token_version + 1 
            WHERE user_id = ?
        `;
        await con.query(updateQuery, [hashPassword, user_id]);

        return res.status(200).json({ result: true, msg: "Changed password successfully" });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ result: false, msg: 'Internal server error' });
    }
}

const forceLogout = async (req, res) => {
    try {

        const { error, value } = validator(schemas.resetPassword)(req.body);
        if (error) {
            return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
        }

        const selectQuery = `
            SELECT u.user_id, u.token_version, s.status_name 
            FROM tbl_user u
            JOIN tbl_user_status s ON u.status_id = s.status_id
            WHERE u.username = ?
        `;
        const [userData] = await con.query(selectQuery, [req.body.username]);

        if (userData.length === 0) {
            return res.status(404).json({ result: false, msg: "Invalid username" });
        }

        const userRecord = userData[0];

        if (userRecord.status_name === 'Inactive') {
            return res.status(400).json({ result: false, msg: "User is already inactive" });
        }

        // update for token version and status to 'Inactive'
        const updateQuery = `
            UPDATE tbl_user
            SET token_version = token_version + 1,
                status_id = (SELECT status_id FROM tbl_user_status WHERE status_name = 'Inactive')
            WHERE user_id = ?
        `
        await con.query(updateQuery, [userRecord.user_id]);

        return res.status(200).json({ result: true, msg: "User has been logged out and marked as inactive" });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
}

const postGetMe = async (req, res) => {
    try {

        const userData = {
            id: req.user.id,
            token_version: req.user.token_version,
        };

        const { error } = validator(schemas.getUser)(userData);
        if (error) {
            return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
        }

        const selectQuery = `
            SELECT 
                u.user_id, u.first_name, u.last_name, u.username, u.employee_code, u.avatar, 
                us.status_name,
                r.role_id, r.role_name
            FROM tbl_user u
            JOIN tbl_user_status us ON us.status_id = u.status_id
            JOIN tbl_role r ON r.role_id = u.role_id
            WHERE u.user_id = ?
        `;
        const [userRecord] = await con.query(selectQuery, [req.user.id]);

        if (userRecord.length === 0) {
            return res.status(404).json({ result: false, msg: "Not found user details" });
        }

        const userDetails = userRecord[0];

        return res.status(200).json({
            result: true,
            msg: "Data fetched successfully",
            data: {
                user_id: userRecord.user_id,
                status: userDetails.status_name,
                role: {
                    role_id: userDetails.role_id,
                    role_name: userDetails.role_name,
                },
                profile: {
                    first_name: userDetails.first_name,
                    last_name: userDetails.last_name,
                    fullname: `${userDetails.first_name} ${userDetails.last_name}`,
                    username: userDetails.username,
                    code: userDetails.employee_code,
                    avatar: userDetails.avatar,
                },
            },
        });
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ result: false, msg: "Internal server error" });
    }
}

module.exports = {
    loginPost, logout, resetPassword, changePassword, forceLogout, postGetMe
}