const express = require("express");
const incidentController = require("../controllers/incidentController");
const { requireAuth, requireRole } = require("../middleware/sessionAuth");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(["SCHOOL_ADMIN", "SCHOOL_NURSE"]));

router.get("/", incidentController.list);
router.get("/:id", incidentController.getById);
router.patch("/:id", incidentController.update);
router.post("/:id/actions", incidentController.addAction);

module.exports = router;
