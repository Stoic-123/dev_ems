const fs = require('fs');
const moment = require('moment');

const con = require('../../config/db');

const { checkUserStatus } = require('../../utils/checkUserStatus');
const { validator, schemas } = require('../../validation/profile');

const updateEmployeeAvatar = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { error } = validator(schemas.userId)({ user_id });
        if (error)  return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });

        await checkUserStatus(user_id);

        const [userAvatar] = await con.query("SELECT avatar FROM tbl_user WHERE user_id = ?", [user_id]);
        const currentAvatar = userAvatar[0].avatar;

        let newAvatar;
        if (!req.files || !req.files.avatar) {
            newAvatar = currentAvatar;
        } else {
            const sampleFile = req.files.avatar;

            const allowedTypes = ['image/jpeg', 'image/png'];
            if (!allowedTypes.includes(sampleFile.mimetype)) return res.status(400).json({ result: false, msg: 'Invalid file type. Only JPEG and PNG are allowed' });

            const maxFileSize = 5 * 1024 * 1024;
            if (sampleFile.size > maxFileSize) return res.status(400).json({ result: false, msg: 'File size exceeds the limit of 5MB' });

            const sampleFileName = `${moment.now()}_${sampleFile.name}`;
            const uploadPath = `./public/upload/${sampleFileName}`;

            await sampleFile.mv(uploadPath);

            if (currentAvatar && currentAvatar !== 'default.png') {
                try {
                    fs.unlinkSync(`./public/upload/${currentAvatar}`);
                } catch (err) {
                    console.error('Error deleting old avatar:', err);
                }
            }

            newAvatar = sampleFileName;
        }
        await con.query("UPDATE tbl_user SET avatar = ? WHERE user_id = ?", [newAvatar, user_id]);

        res.status(200).json({ result: true, msg: 'Profile avatar updated successfully', avatar: newAvatar });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ result: false, msg: 'Internal server error' });
    }
};

const deleteEmployeeAvatar = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { error } = validator(schemas.userId)({ user_id });
        if (error) return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });

        await checkUserStatus(user_id);

        const [userAvatar] = await con.query("SELECT avatar FROM tbl_user WHERE user_id = ?", [user_id]);
        const currentAvatar = userAvatar[0].avatar;

        if (currentAvatar && currentAvatar !== 'default.png') {
            try {
                fs.unlinkSync(`./public/upload/${currentAvatar}`);
            } catch (err) {
                console.error('Error deleting old avatar:', err);
            }
        }
        await con.query("UPDATE tbl_user SET avatar = 'default.png' WHERE user_id = ?", [user_id]);

        res.status(200).json({ result: true, msg: 'Profile avatar deleted successfully', avatar: 'default.png' });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ result: false, msg: 'Internal server error' });
    }
};

const updateEmployeeEmail = async (req, res) => {
    try {
        const user_id = req.user.id; 
        const body = req.body; 
        body.user_id = user_id;
        const { error } = validator(schemas.updateEmployeeEmail)(body);
        if (error) return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });

        await checkUserStatus(user_id);

        const [existingEmail] = await con.query("SELECT 1 FROM tbl_user WHERE email = ?", [body.email]);
        if (existingEmail.length > 0) return res.status(400).json({ result: false, msg: "This email is already in use by another user" });

        await con.query("UPDATE tbl_user SET email = ? WHERE user_id = ?", [body.email, body.user_id]);

        res.status(200).json({ result: true, msg: "Email updated successfully" });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ result: false, msg: 'Internal server error' });
    }
};

const deleteEmployeeEmail = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { error } = validator(schemas.userId)({ user_id });
        if (error) return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });

        await checkUserStatus(user_id);

        await con.query("UPDATE tbl_user SET email = NULL WHERE user_id = ?", [user_id]);

        res.status(200).json({ result: true, msg: "Email deleted successfully" });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ result: false, msg: 'Internal server error' });
    }
};

module.exports = {
    updateEmployeeAvatar, deleteEmployeeAvatar, updateEmployeeEmail, deleteEmployeeEmail
};