const con = require("../../config/db");
const postAnnouncement = async (req, res) => {
  const { title, content } = req.body;
  const created_by = req.user.id;

  try {
    const userName = `Select first_name, last_name from tbl_user where role_id = 1`;
    const [dataUserName] = await con.query(userName);
    const { first_name, last_name } = dataUserName[0];
    const username = `${first_name} ${last_name}`
    // Step 1: Insert the announcement into tbl_announcement
    const insertAnnouncementSql = `
        INSERT INTO tbl_announcement (title, content, created_by)
        VALUES (?, ?, ?)
      `;
    const [announcementResult] = await con.query(insertAnnouncementSql, [title, content, created_by]);
    const announcementId = announcementResult.insertId;

    // Step 2: Fetch all users
    const usersSql = "SELECT user_id FROM tbl_user WHERE role_id = 2";
    const [users] = await con.query(usersSql);

    // Step 3: Insert a record into tbl_announcement_user for each user
    const insertUserAnnouncementSql = `
        INSERT INTO tbl_announcement_user (announcement_user_id, user_id, status)
        VALUES (?, ?, 'Unread')
      `;
    for (const user of users) {
      await con.query(insertUserAnnouncementSql, [announcementId, user.user_id]);
      const io = req.app.get("io");
      io.to("staff").emit("new_announcement", {
        notification_id: announcementId,
        title: title,
        content: content,
        announcement_by: username,
        created_at: new Date(),
      });
    }

    res.status(200).json({
      result: true,
      msg: "Announcement created and sent to all users.",
      data: { announcementId },
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};
const getAnnouncementsForUser = async (req, res) => {
  const user_id = req.user.id;

  try {
    const sql = `
        SELECT 
          a.announcement_id, 
          a.title, 
          a.content, 
          au.status, 
          a.created_at, 
          au.read_at,
          u.first_name AS created_by_first_name, 
          u.last_name AS created_by_last_name   
        FROM tbl_announcement a
        INNER JOIN tbl_announcement_user au ON a.announcement_id = au.announcement_user_id
        INNER JOIN tbl_user u ON a.created_by = u.user_id 
        WHERE au.user_id = ? AND a.delete_at IS NULL
        ORDER BY a.created_at DESC
      `;
    const [announcements] = await con.query(sql, [user_id]);

    if (announcements.length === 0) {
      return res.status(200).json({ result: true, msg: "No announcements exist yet for this user." });
    }

    // Return the announcements with their read/unread status and admin's name
    res.status(200).json({ result: true, data: announcements });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};
const viewDetailAnnouncement = async (req, res) => {
  const { announcement_id } = req.params;
  const user_id = req.user.id;
  try {
    const updateSql = `
        UPDATE tbl_announcement_user
        SET status = 'Read', read_at = CURRENT_TIMESTAMP
        WHERE announcement_user_id = ? AND user_id = ?
      `;
    const [updateResult] = await con.query(updateSql, [announcement_id, user_id]);
    console.log(updateResult);
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ result: false, msg: "Announcement not found for this user." });
    }

    const selectSql = `
        SELECT 
          a.announcement_id, 
          a.title, 
          a.content, 
          au.status, 
          a.created_at,
          au.read_at,
          u.first_name AS created_by_first_name,
          u.last_name AS created_by_last_name   
        FROM tbl_announcement a
        INNER JOIN tbl_announcement_user au ON a.announcement_id = au.announcement_user_id
        INNER JOIN tbl_user u ON a.created_by = u.user_id 
        WHERE au.announcement_user_id = ? AND au.user_id = ?
      `;
    const [announcement] = await con.query(selectSql, [announcement_id, user_id]);

    if (announcement.length === 0) {
      return res.status(404).json({ result: false, msg: "Announcement not found." });
    }

    res.status(200).json({ result: true, data: announcement[0] });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};
const deleteAnnouncement = async (req, res) => {
  const { announcement_id } = req.params;
console.log(announcement_id);

  try {
    const sql = `
      UPDATE tbl_announcement
      SET delete_at = NOW()
      WHERE announcement_id = ? 
    `;

    const [result] = await con.query(sql, [announcement_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ result: false, msg: "Announcement not found." });
    }

    res.status(200).json({ result: true, msg: "Announcement deleted successfully." });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ result: false, msg: "Internal server error" });
  }
};
module.exports = {
  postAnnouncement,
  getAnnouncementsForUser,
  viewDetailAnnouncement,
  deleteAnnouncement
}