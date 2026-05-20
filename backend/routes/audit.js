const express = require("express");
const auditController = require("../controllers/auditController");
const { requireAuth, requireRole } = require("../middleware/sessionAuth");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(["PLATFORM_OWNER"]));

router.get("/events", auditController.list);

module.exports = router;
