const express = require('express');

const { getAllStatus,postCreateStatus} = require('../../controllers/api/userStatus');
const { requireAuth } = require('../../middlewares/auth');
const { isAdmin } = require('../../middlewares/role');

const router = express.Router();

router.get("/get-user-status",requireAuth,isAdmin,getAllStatus)
router.post("/create-status",requireAuth,isAdmin,postCreateStatus)


module.exports = router;
