const con = require("../../config/db");
const getNotificationsForAdmin = async (req, res) => {
  const admin_id = req.user.id;

  try {
    const sql = `
        SELECT 
          n.notification_id, 
          n.message, 
          n.type, 
          na.status, 
          n.created_at, 
          na.read_at
        FROM tbl_notification n
        INNER JOIN tbl_notification_admin na ON n.notification_id = na.notification_id
        WHERE na.admin_id = ? AND n.delete_at IS NULL
        ORDER BY n.created_at DESC
    `;
    const [notifications] = await con.query(sql, [admin_id]);

    if (notifications.length === 0) {
      return res.status(200).json({ result: true, msg: "No notifications exist yet for this admin." });
    }

    res.status(200).json({ result: true, data: notifications });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};


const getNotificationDetails = async (req, res) => {
  const { notification_id } = req.params;
  const admin_id = req.user.id;

  try {
    const updateSql = `
        UPDATE tbl_notification_admin
        SET status = 'Read', read_at = CURRENT_TIMESTAMP
        WHERE notification_id = ? AND admin_id = ?
    `;
    const [updateResult] = await con.query(updateSql, [notification_id, admin_id]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ result: false, msg: "Notification not found for this admin." });
    }

    // Emit a real-time update to all admins
    const io = req.app.get("io");
    io.emit("notification_read", {
      notification_id: notification_id,
      admin_id: admin_id,
      read_at: new Date(),
    });

    // Fetch and return notification details
    const typeSql = `
        SELECT n.type 
        FROM tbl_notification n 
        WHERE n.notification_id = ? 
    `;
    const [typeResult] = await con.query(typeSql, [notification_id]);

    if (typeResult.length === 0) {
      return res.status(404).json({ result: false, msg: "Notification not found." });
    }

    const notificationType = typeResult[0].type;

    let sql;
    if (notificationType === 'Leave Request') {
      sql = `
        SELECT 
          l.start_date, 
          l.end_date, 
          l.partial_day, 
          l.reason, 
          l.attachment,
          u.username,
          n.message,
          lt.leave_type
        FROM tbl_leave l
        JOIN tbl_leave_type lt ON lt.leave_type_id = l.leave_type_id
        JOIN tbl_user u ON u.user_id = l.user_id
        JOIN tbl_notification n ON n.user_id = u.user_id
        INNER JOIN tbl_notification_admin na ON n.notification_id = na.notification_id
        WHERE n.notification_id = ? AND na.admin_id = ?
      `;
    } else if (notificationType === 'Overtime Request') {
      sql = `
        SELECT 
          o.start_time, 
          o.end_time, 
          o.reason, 
          u.username,
          n.message
        FROM tbl_overtime o
        JOIN tbl_user u ON u.user_id = o.user_id
        JOIN tbl_notification n ON n.user_id = u.user_id
        INNER JOIN tbl_notification_admin na ON n.notification_id = na.notification_id
        WHERE n.notification_id = ? AND na.admin_id = ? 
      `;
    } else {
      return res.status(400).json({ result: false, msg: "Invalid notification type." });
    }

    const [notificationDetails] = await con.query(sql, [notification_id, admin_id]);

    if (notificationDetails.length === 0) {
      return res.status(404).json({ result: false, msg: "Notification details not found." });
    }

    res.status(200).json({ result: true, data: notificationDetails[0] });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};
const deleteNotification = async (req, res) => {
  const { notification_id } = req.params;

  try {
    const sql = `
      UPDATE tbl_notification
      SET delete_at = NOW()
      WHERE notification_id = ? 
    `;

    const [result] = await con.query(sql, [notification_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ result: false, msg: "Notification not found." });
    }

    res.status(200).json({ result: true, msg: "Notification deleted successfully." });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};

module.exports = { getNotificationsForAdmin, getNotificationDetails, deleteNotification };

