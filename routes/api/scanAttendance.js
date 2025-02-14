const express = require("express");


const router = express.Router();

const { generateQR, scanQR } = require("../../controllers/api/scanAttendance");
const { requireAuth } = require("../../middlewares/auth");
const { isAdmin } = require("../../middlewares/role");

router.get("/generateQr", requireAuth, isAdmin, generateQR);
router.post("/scanQr", requireAuth, scanQR);

module.exports = router;
