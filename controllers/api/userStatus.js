const con = require("../../config/db");
const {validator,schemas}=require("../../validation/userStatus")

const getAllStatus = async (req, res) => {
    const sql = "SELECT * FROM tbl_user_status";
    try {
        const [data] = await con.query(sql);

        if (data.length === 0) {
            return res.status(404).json({ result: false, msg: "Status not found" });
        }

        res.status(200).json({ result: true, msg: "Status found", data: data });
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ result: false, msg: "Internal server error" });
    }
}
const postCreateStatus = async (req, res) => {
    const { error, value } = validator(schemas.postUserStatuse)(req.body);
  if (error) {
    return res.status(400).json({
      result: false,
      msg: "Validation errors",
      errors: error.details.map((err) => err.message),
    });
  }
    const { status_name } = req.body;
    const sql = "INSERT INTO `tbl_user_status` (`status_name`) VALUES (?)";
    try {
        const [result] = await con.query(sql, [status_name]);

        res.status(201).json({ result: true, msg: "Status created successfully", data: result });
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ result: false, msg: "Internal server error" });
    }
}


module.exports = { getAllStatus,postCreateStatus }