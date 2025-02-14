const moment = require('moment');

const con = require("../../config/db");
const { validator, schemas } = require("../../validation/position");

// Create a new position
const createPosition = async (req, res) => {
  try {
    const { department_id, position_name, description } = req.body;
    const { error } = validator(schemas.createPosition)(req.body);
    if (error) {
      return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
    }

    const [department] = await con.query(
      "SELECT status FROM tbl_department WHERE department_id = ?",
      [department_id]
    );

    if (department.length === 0) {
      return res.status(404).json({ result: false, msg: "Department not found" });
    }

    if (department[0].status === "Inactive") {
      return res.status(400).json({ result: false, msg: "Department is deactivated" });
    }

    const [positionExists] = await con.query(
      "SELECT 1 FROM tbl_position WHERE department_id = ? AND position_name = ?",
      [department_id, position_name]
    );

    if(positionExists.length > 0) {
      return res.status(400).json({ result: false, msg: "Position name already exists in this department" });
    }

    const [result] = await con.query(
      "INSERT INTO tbl_position (department_id, position_name, description) VALUES (?, ?, ?)",
      [department_id, position_name, description]
    );

    res.status(201).json({ result: true, msg: "Position created successfully" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};

// Get all positions with optional status filter
const getAllPositions = async (req, res) => {
  try {
    const { status } = req.query;
    const { error } = validator(schemas.getPositionStatus)({ status });
    if (error) return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });

    let selectQuery = `
      SELECT d.department_name, p.position_name, p.description, p.status, p.created_at
      FROM tbl_position p
      JOIN tbl_department d ON p.department_id = d.department_id`;

    let queryParams = [];
    if (status) {
      selectQuery += ` WHERE p.status = ?`;
      queryParams.push(status);
    }

    const [data] = await con.query(selectQuery, queryParams);

    if (data.length === 0) return res.status(200).json({ result: true, msg: "No positions found", data: [] });

    data.forEach(position => {
      position.created_at = moment(position.created_at).format('YYYY-MM-DD HH:mm:ss');
    });

    res.status(200).json({ result: true, msg: "Positions fetched successfully", data });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};

// Search for position by name with optional status filter
const getPositionByName = async (req, res) => {
  try {
    const { position_name, status } = req.query;
    const { error } = validator(schemas.getPositionByName)({ position_name });
    if (error) return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });

    let selectQuery = `
      SELECT d.department_name, p.position_name, p.description, p.status, p.created_at
      FROM tbl_position p
      JOIN tbl_department d ON p.department_id = d.department_id
      WHERE p.position_name LIKE ?`;
    
    let queryParams = [`%${position_name}%`];
    if (status) {
      selectQuery += ` AND p.status = ?`;
      queryParams.push(status);
    }

    const [data] = await con.query(selectQuery, queryParams);

    if (data.length === 0) return res.status(200).json({ result: true, msg: "No positions found", data: [] });

    res.status(200).json({ result: true, msg: "Positions fetched successfully", data });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};

// Get a specific department by ID
const getPositionById = async (req, res) => {
  try {
    const { position_id } = req.params;
    const { error } = validator(schemas.getPositionById)({ position_id });
    if (error) {
      return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
    }

    const [data] = await con.query(
      "SELECT * FROM tbl_position WHERE position_id = ?",
      [position_id]
    );

    if (data.length === 0) {
      return res.status(404).json({ result: false, msg: "Position not found" });
    }

    res.status(200).json({ result: true, msg: "Position fetched successfully", data: data[0] });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};

// Update a specific position by ID
const updatePosition = async (req, res) => {
  try {
    const { position_id } = req.params;
    const { description } = req.body;

    const validationData = {
      params: req.params,
      body: req.body
    };
    const { error } = validator(schemas.updatePosition)(validationData);
    if (error) {
      return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
    }

    const descriptionValue = description === "" ? null : description;
    const [result] = await con.query(
      "UPDATE tbl_position SET description = ? WHERE position_id = ?",
      [descriptionValue, position_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ result: false, msg: "Failed to update position" });
    }

    res.status(200).json({ result: true, msg: "Position updated successfully" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};

// Delete a specific position by ID
const deletePosition = async (req, res) => {
  const connection = await con.getConnection();
  try {
    const { position_id } = req.params;
    const { error } = validator(schemas.deletePosition)({ position_id });
    if (error) return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });

    const [position] = await connection.query("SELECT status FROM tbl_position WHERE position_id = ?", [position_id]);

    if (position.length === 0) return res.status(404).json({ result: false, msg: "Position not found" });
    if (position[0].status === "Inactive") return res.status(400).json({ result: false, msg: "Position is already deactivated" });

    await connection.beginTransaction();

    const [deactivatePositionResult] = await connection.query(
      "UPDATE tbl_position SET status = ?, deleted_at = NOW() WHERE position_id = ?",
      ['Inactive', position_id]
    );

    if (deactivatePositionResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ result: false, msg: "Failed to delete position" });
    }

    const [defaultPosition] = await connection.query(
      "SELECT position_id FROM tbl_position WHERE position_name = 'Unassigned' LIMIT 1"
    );

    if (defaultPosition.length === 0) {
      await connection.rollback();
      return res.status(400).json({ result: false, msg: "Default 'Unassigned' position not found" });
    }

    const [updateEmployeesResult] = await connection.query(
      "UPDATE tbl_user SET position_id = ? WHERE position_id = ? AND deleted_at IS NULL",
      [defaultPosition[0].position_id, position_id]
    );

    await connection.commit();

    res.status(200).json({ result: true, msg: "Position has been deactivated and employees reassigned" });
  } catch (error) {
    console.error("Server error:", error);
    await connection.rollback();
    res.status(500).json({ result: false, msg: "Internal server error" });
  } finally {
    connection.release(); 
  }
};

// Reactivate a specific department by ID
const activatePosition = async (req, res) => {
  try {
    const { position_id } = req.params;
    const { error } = validator(schemas.activatePosition)(req.params);
    if (error) {
      return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
    }

    const [position] = await con.query(
      "SELECT status, department_id FROM tbl_position WHERE position_id = ?",
      [position_id]
    );

    if (position.length === 0) {
      return res.status(404).json({ result: false, msg: "Position not found" });
    }

    if (position[0].status === "Active") {
      return res.status(400).json({ result: false, msg: "Position is already activated" });
    }

    const [department] = await con.query(
      "SELECT status FROM tbl_department WHERE department_id = ?",
      [position[0].department_id]
    );

    if (department.length === 0 || department[0].status !== "Active") {
      return res.status(400).json({ result: false, msg: "Department is deactivated, position cannot be activated" });
    }

    const [result] = await con.query(
      "UPDATE tbl_position SET status = ?, deleted_at = NULL WHERE position_id = ?",
      ["Active", position_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ result: false, msg: "Failed to reactivate position" });
    }

    res.status(200).json({ result: true, msg: "Position has been reactivated" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};

// Get position summary (total, active, inactive)
const getPositionSummary = async (req, res) => {
  try {
    const [summary] = await con.query(`
      SELECT 
        COUNT(*) AS total_positions,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active_positions,
        SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) AS inactive_positions
      FROM tbl_position
    `);

    res.status(200).json({
      result: true,
      msg: "Position summary fetched successfully",
      data: summary[0],
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};

module.exports = {
  createPosition,
  getAllPositions,
  getPositionSummary,
  getPositionByName,
  getPositionById,
  updatePosition,
  deletePosition,
  activatePosition
};