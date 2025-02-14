const moment = require('moment');

const con = require("../../config/db");
const { validator, schemas } = require("../../validation/department");

// Create a new department
const createDepartment = async (req, res) => {
  try {
    const { department_name, description, manager_id } = req.body;

    const { error } = validator(schemas.createDepartment)(req.body);
    if (error) {
      return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
    }

    const [departmentExists] = await con.query(
      "SELECT 1 FROM tbl_department WHERE department_name = ?",
      [department_name]
    );

    if (departmentExists.length > 0) {
      return res.status(400).json({ result: false, msg: "Department name already exists" });
    }

    if (manager_id) {
      const [userExists] = await con.query(`
        SELECT 1 FROM tbl_user u 
        WHERE u.user_id = ? AND u.status_id = (
          SELECT s.status_id FROM tbl_user_status s WHERE s.status_name = 'Active'
        )`,
        [manager_id]
      );

      if (userExists.length === 0) {
        return res.status(400).json({ result: false, msg: "Invalid or inactive user" });
      }

      const [isAlreadyManager] = await con.query(
        "SELECT 1 FROM tbl_department WHERE manager_id = ?",
        [manager_id]
      );

      if (isAlreadyManager.length > 0) {
        return res.status(400).json({ result: false, msg: "User is already managing another department" });
      }
    }

    const [result] = await con.query(
      "INSERT INTO tbl_department (department_name, description, manager_id) VALUES (?, ?, ?)",
      [department_name, description || null, manager_id || null] 
    );

    res.status(201).json({ result: true, msg: "Department created successfully" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};

// Get all departments
const getAllDepartment = async (req, res) => {
  try {
    const { status } = req.query;
    const { error } = validator(schemas.getDepartmentStatus)({ status });
    if (error) return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });

    let selectQuery = `
      SELECT d.department_name, CONCAT(u.first_name, ' ', u.last_name) AS manager_name, d.status, d.created_at
      FROM tbl_department d
      LEFT JOIN tbl_user u ON d.manager_id = u.user_id
    `;
    if (status) selectQuery += ` WHERE d.status = ?`;

    const [data] = await con.query(selectQuery, [status].filter(Boolean));

    if (data.length === 0) {
      return res.status(404).json({ result: false, msg: "No departments found" });
    }

    data.forEach(department => {
      department.created_at = moment(department.created_at).format('YYYY-MM-DD HH:mm:ss');
    });

    res.status(200).json({ result: true, msg: "Departments fetched successfully", data });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};

// Search for department by name
const getDepartmentByName = async (req, res) => {
  try {
    const { department_name, status } = req.query;
    const { error } = validator(schemas.getDepartmentByName)({ department_name, status });
    if (error) return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });

    let selectQuery = `
      SELECT d.department_name, CONCAT(u.first_name, ' ', u.last_name) AS manager_name, d.status, d.created_at
      FROM tbl_department d
      LEFT JOIN tbl_user u ON d.manager_id = u.user_id
      WHERE department_name LIKE ?
    `;

    let queryParams = [`%${department_name}%`];

    if (status) {
      selectQuery += ` AND d.status = ?`;
      queryParams.push(status);
    }

    const [data] = await con.query(selectQuery, queryParams);

    if (data.length === 0) return res.status(404).json({ result: false, msg: "No departments found", data: [] });

    data.forEach(department => {
      department.created_at = moment(department.created_at).format('YYYY-MM-DD HH:mm:ss');
    });

    res.status(200).json({ result: true, msg: "Departments fetched successfully", data });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};

// Get a specific department by ID
const getDepartmentById = async (req, res) => {
  try {
    const { department_id } = req.params;
    const { error } = validator(schemas.getDepartmentById)(req.params);
    if (error) {
      return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
    }

    const [departmentData] = await con.query(`
      SELECT d.department_name, d.status AS department_status, 
      CONCAT(u.first_name, ' ', u.last_name) AS manager_name, d.created_at, 
      CASE 
        WHEN d.status = 'Inactive' THEN d.deleted_at 
        ELSE NULL 
      END AS deleted_at
      FROM tbl_department d
      LEFT JOIN tbl_user u ON d.manager_id = u.user_id
      WHERE d.department_id = ?`,
      [department_id]
    );

    if (departmentData.length === 0) {
      return res.status(404).json({ result: false, msg: "Department not found" });
    }

    const [positions] = await con.query(
      "SELECT position_name, status AS position_status FROM tbl_position WHERE department_id = ?",
      [department_id]
    );

    let responseData = {
      department_name: departmentData[0].department_name,
      department_status: departmentData[0].department_status,
      manager_name: departmentData[0].manager_name || "Not Assigned",
      created_at: moment(departmentData[0].created_at).format('YYYY-MM-DD HH:mm:ss'),
      deleted_at: moment(departmentData[0].deleted_at).format('YYYY-MM-DD HH:mm:ss')
    };

    positions.forEach((pos, index) => {
      responseData[`position_${index + 1}`] = {
        position_name: pos.position_name,
        position_status: pos.position_status,
      };
    });

    res.status(200).json({
      result: true,
      msg: "Department fetched successfully",
      data: responseData
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};

// Update a specific department by ID
const updateDepartment = async (req, res) => {
  try {
    const { department_id } = req.params;
    const { description, manager_id } = req.body;

    const validationData = { params: req.params, body: req.body };
    const { error } = validator(schemas.updateDepartment)(validationData);
    if (error) return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });

    const descriptionValue = description === "" ? null : description;

    const [department] = await con.query("SELECT manager_id, status FROM tbl_department WHERE department_id = ?", [department_id]);
    if (department.length === 0) return res.status(400).json({ result: false, msg: "Department not found" });
    if (department[0].status !== 'Active') return res.status(400).json({ result: false, msg: "Department is deactivated" });

    let newManagerId = department[0].manager_id; 
    if (manager_id) {
      const [user] = await con.query(
        `SELECT 1 FROM tbl_user WHERE user_id = ? AND status_id = (
          SELECT status_id FROM tbl_user_status WHERE status_name = 'Active'
        )`, 
        [manager_id]
      );
      if (user.length === 0) return res.status(400).json({ result: false, msg: "User invalid" });

      const [isAlreadyManager] = await con.query(
        "SELECT 1 FROM tbl_department WHERE manager_id = ? AND status = 'Active' AND department_id != ?",
        [manager_id, department_id]
      );
      if (isAlreadyManager.length > 0) return res.status(400).json({ result: false, msg: "User is already managing another department" });

      newManagerId = manager_id;
    }

    const [updateResult] = await con.query(
      "UPDATE tbl_department SET description = ?, manager_id = ? WHERE department_id = ?",
      [descriptionValue, newManagerId, department_id]
    );

    if (updateResult.affectedRows === 0) return res.status(404).json({ result: false, msg: "Failed to update department" });

    res.status(200).json({ result: true, msg: "Department updated successfully" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};

// Delete a specific department by ID
const deleteDepartment = async (req, res) => {
  let connection;
  try {
    const adminId = req.user.id;
    const { department_id } = req.params;
    const { error } = validator(schemas.deleteDepartment)(req.params);
    if (error) {
      return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
    }

    connection = await con.getConnection();
    await connection.beginTransaction();

    const [department] = await connection.query("SELECT status FROM tbl_department WHERE department_id = ?", [department_id]);

    if (department.length === 0) {
      await connection.rollback();
      return res.status(404).json({ result: false, msg: "Department not found" });
    }

    if (department[0].status === "Inactive") {
      await connection.rollback();
      return res.status(400).json({ result: false, msg: "Department is already deactivated" });
    }

    const [updateDepartment] = await connection.query("UPDATE tbl_department SET status = ?, deleted_at = NOW() WHERE department_id = ?", ["Inactive", department_id]);

    if (updateDepartment.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ result: false, msg: "Failed to delete department" });
    }

    await connection.query("UPDATE tbl_position SET status = ?, deleted_at = NOW() WHERE department_id = ?", ["Inactive", department_id]);

    const [defaultPosition] = await connection.query("SELECT position_id FROM tbl_position WHERE position_name = 'Unassigned' LIMIT 1");

    if (defaultPosition.length === 0) {
      await connection.rollback();
      return res.status(400).json({ result: false, msg: "Default 'Unassigned' position not found" });
    }

    const unassignedPositionId = defaultPosition[0].position_id;

    const [affectedEmployees] = await connection.query(`
      SELECT user_id, position_name FROM tbl_user 
      INNER JOIN tbl_position ON tbl_user.position_id = tbl_position.position_id 
      WHERE tbl_user.position_id IN (
        SELECT position_id FROM tbl_position WHERE department_id = ?) 
        AND tbl_user.deleted_at IS NULL`, [department_id]
    );

    await connection.query(
      "UPDATE tbl_user SET position_id = ? WHERE position_id IN (SELECT position_id FROM tbl_position WHERE department_id = ?) AND deleted_at IS NULL",
      [unassignedPositionId, department_id]
    );

    const historyEntries = affectedEmployees.map(({ user_id, position_name }) => [
      user_id, adminId, "Position", position_name, "Unassigned", new Date()
    ]);

    if (historyEntries.length > 0) {
      await connection.query(
        "INSERT INTO tbl_user_history (user_id, changed_by, change_type, old_value, new_value, effective_date) VALUES ?",
        [historyEntries]
      );
    }

    await connection.commit();

    res.status(200).json({ result: true, msg: "Department and positions have been deactivated" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  } finally {
    if (connection) connection.release(); 
  }
};

// Reactivate a specific department by ID
const activateDepartment = async (req, res) => {
  let connection;
  try {
    const { department_id } = req.params;
    const { positions } = req.body; 
    const { error } = validator(schemas.activateDepartment)({ department_id, positions });
    if (error) {
      return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
    }

    connection = await con.getConnection();
    await connection.beginTransaction();

    const [department] = await connection.query(
      "SELECT status FROM tbl_department WHERE department_id = ?",
      [department_id]
    );

    if (department.length === 0) {
      await connection.rollback();
      return res.status(404).json({ result: false, msg: "Department not found" });
    }

    if (department[0].status === "Active") {
      await connection.rollback();
      return res.status(400).json({ result: false, msg: "Department is already activated" });
    }

    const [validPositions] = await connection.query(
      "SELECT position_id FROM tbl_position WHERE department_id = ?",
      [department_id]
    );

    const validPositionIds = validPositions.map(pos => pos.position_id);

    if (positions && positions.length > 0) {
      const invalidPositions = positions.filter(pos => !validPositionIds.includes(pos));

      if (invalidPositions.length > 0) {
        await connection.rollback();
        return res.status(400).json({ result: false, msg: "Invalid position" });
      }
    }

    await connection.query(
      "UPDATE tbl_department SET status = ?, deleted_at = NULL WHERE department_id = ?",
      ["Active", department_id]
    );

    if (positions && positions.length > 0) {
      await connection.query(
        "UPDATE tbl_position SET status = ?, deleted_at = NULL WHERE department_id = ? AND position_id IN (?)",
        ["Active", department_id, positions]
      );
    } else {
      await connection.query(
        "UPDATE tbl_position SET status = ?, deleted_at = NULL WHERE department_id = ? AND status = 'Inactive'",
        ["Active", department_id]
      );
    }

    await connection.commit();

    res.status(200).json({ result: true, msg: "Department and positions reactivated" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// Assign a manager to a specific department
const assignManager = async (req, res) => {
  try {
    const { department_id } = req.params;
    const { user_id } = req.body;
    const validationData = {
      params: req.params,
      body: req.body
    };
    const { error } = validator(schemas.assignManager)(validationData);
    if (error) {
      return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
    }

    const [department] = await con.query(
      "SELECT manager_id FROM tbl_department WHERE department_id = ? AND status = 'Active'",
      [department_id]
    );

    if (department.length === 0) {
      return res.status(400).json({ result: false, msg: "Department is deactivated or invalid" });
    }

    const [user] = await con.query(`SELECT 1 FROM tbl_user u 
      WHERE u.user_id = ? AND u.status_id = (
        SELECT s.status_id FROM tbl_user_status s WHERE s.status_name = 'Active'
      )`, 
      [user_id]
    );

    if (user.length === 0) {
      return res.status(400).json({ result: false, msg: "Invalid or inactive user" });
    }

    const [isAlreadyManager] = await con.query(
      "SELECT 1 FROM tbl_department WHERE manager_id = ? AND status = 'Active'",
      [user_id]
    );
    
    const currentManagerId = department[0].manager_id;
    if (currentManagerId && currentManagerId == user_id) {
      return res.status(400).json({ result: false, msg: "This user is already assigned to manage this department" });
    }

    if (isAlreadyManager.length > 0) {
      return res.status(400).json({ result: false, msg: "User is already managing another department" });
    }

    const [result] = await con.query(
      "UPDATE tbl_department SET manager_id = ? WHERE department_id = ?",
      [user_id, department_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ result: false, msg: "Failed to assign manager" });
    }

    res.status(200).json({
      result: true,
      msg: currentManagerId ? "Manager changed successfully" : "Manager assigned successfully",
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};

// Remove a manager from a specific department
const removeManager = async (req, res) => {
  try {
    const { department_id } = req.params;
    const { error } = validator(schemas.removeManager)(req.params);
    if (error) {
      return res.status(400).json({ result: false, errors: error.details.map((err) => err.message) });
    }

    const [department] = await con.query(
      "SELECT manager_id FROM tbl_department WHERE department_id = ?",
      [department_id]
    );

    if (department.length === 0) {
      return res.status(404).json({ result: false, msg: "Department not found" });
    }

    if (!department[0].manager_id) {
      return res.status(400).json({ result: false, msg: "Department already has no manager" });
    }

    const [result] = await con.query(
      "UPDATE tbl_department SET manager_id = NULL WHERE department_id = ?",
      [department_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ result: false, msg: "Failed to remove manager" });
    }

    res.status(200).json({ result: true, msg: "Manager removed successfully" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};

// Get department summary (total, active, inactive)
const getDepartmentSummary = async (req, res) => {
  try {
    const [summary] = await con.query(`
      SELECT 
        COUNT(*) AS total_departments,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active_departments,
        SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) AS inactive_departments
      FROM tbl_department
    `);

    res.status(200).json({
      result: true,
      msg: "Department summary fetched successfully",
      data: summary[0],
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};

module.exports = {
  createDepartment,
  getAllDepartment,
  getDepartmentSummary,
  getDepartmentByName,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  activateDepartment,
  assignManager,
  removeManager,
};