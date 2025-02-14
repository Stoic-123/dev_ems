const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middlewares/auth');
const { isAdmin } = require("../../middlewares/role")
const { postAnnouncement, getAnnouncementsForUser, viewDetailAnnouncement, deleteAnnouncement } = require("../../controllers/api/announcement")
router.post("/createAnnouncement", requireAuth, isAdmin, postAnnouncement);
router.get("/getAnnouncement", requireAuth, getAnnouncementsForUser)
router.get("/viewAnnouncement/:announcement_id", requireAuth, viewDetailAnnouncement)
router.put("/deleteAnnoucement/:announcement_id", requireAuth, deleteAnnouncement)
module.exports = router