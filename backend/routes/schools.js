const express = require("express");
const schoolController = require("../controllers/schoolController");
const { requireAuth, requireRole } = require("../middleware/sessionAuth");

const router = express.Router();

router.use(requireAuth);
router.get("/", requireRole(["GENIDOC_ADMIN", "PLATFORM_OWNER"]), schoolController.listSchools);
router.post("/", requireRole(["GENIDOC_ADMIN", "PLATFORM_OWNER"]), schoolController.createSchool);
router.get("/current", requireRole(["SCHOOL_ADMIN", "SCHOOL_NURSE"]), schoolController.getCurrentSchool);
router.get("/:id/classes", requireRole(["SCHOOL_ADMIN", "SCHOOL_NURSE"]), schoolController.getClasses);
router.post("/:id/classes", requireRole(["SCHOOL_ADMIN"]), schoolController.createClass);

module.exports = router;
