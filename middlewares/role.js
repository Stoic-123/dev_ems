const con = require('../config/db');

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ result: false, msg: 'You do not have permission to perform this action' });
    }
    next();
};

module.exports = {
    isAdmin
}