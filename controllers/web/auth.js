const con = require('../../config/db');

const loginGet = (req, res) => {
    res.render("pages/login");
};

module.exports = { loginGet };