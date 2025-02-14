const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middlewares/auth');
const { isAdmin } = require("../../middlewares/role")
const { requestOvertime, displayOvertime, detailOvertime, displayAllOvertimeRequest, controllOvetimeRequest, viewDetailOvertimeRequest, assignOvertime, createOvertimeRates, updateOvertimeRates } = require("../../controllers/api/overtime")

router.post("/request-overtime", requireAuth, requestOvertime)
router.get("/display-overtime-history", requireAuth, displayOvertime)
router.get("/display-detail-overtime-history/:overtime_id", requireAuth, detailOvertime)
router.get("/display-all-overtime-request/:action_status", requireAuth, isAdmin, displayAllOvertimeRequest)
router.put("/controll-overtime-request/:overtime_id", requireAuth, isAdmin, controllOvetimeRequest)
router.get("/view-detail-overtime-request/:overtime_id", requireAuth, isAdmin, viewDetailOvertimeRequest)
router.post("/assign-overtime", requireAuth, isAdmin, assignOvertime)
router.post("/create-overtime-rate", requireAuth, isAdmin, createOvertimeRates)
router.put("/update-overtime-rate/:rate_id", requireAuth, isAdmin, updateOvertimeRates)

module.exports = router;