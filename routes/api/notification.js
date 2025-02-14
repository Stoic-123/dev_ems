const express = require('express');
const { isAdmin } = require("../../middlewares/role")
const router = express.Router();
const { requireAuth } = require('../../middlewares/auth');
const { getNotificationsForAdmin, getNotificationDetails, deleteNotification } = require('../../controllers/api/notification');


router.get("/getNotication", requireAuth,isAdmin, getNotificationsForAdmin)
router.get("/readNotification/:notification_id", requireAuth, getNotificationDetails);
router.put("/deleteNotification/:notification_id", requireAuth, deleteNotification);

module.exports = router;