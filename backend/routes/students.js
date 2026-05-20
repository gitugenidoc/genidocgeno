const express = require("express");
const studentController = require("../controllers/studentController");
const healthController = require("../controllers/healthController");
const documentController = require("../controllers/documentController");
const emergencyController = require("../controllers/emergencyController");
const incidentController = require("../controllers/incidentController");
const { requireAuth, requireRole } = require("../middleware/sessionAuth");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(["SCHOOL_ADMIN", "SCHOOL_NURSE"]));

router.get("/", studentController.list);
router.post("/", studentController.create);
router.get("/:id/health-profile", healthController.getProfile);
router.put("/:id/health-profile", healthController.upsertProfile);
router.get("/:id/documents", documentController.listForStudent);
router.post("/:id/documents", documentController.uploadForStudent);
router.post("/:id/incidents", incidentController.createForStudent);
router.get("/:id/emergency-qr", emergencyController.getActiveQr);
router.post("/:id/emergency-qr", emergencyController.createQr);
router.post("/:id/emergency-qr/revoke", emergencyController.revokeQr);
router.get("/:id", studentController.getById);
router.patch("/:id", studentController.update);
router.post("/:id/guardians", studentController.addGuardian);
router.post("/:id/emergency-contacts", studentController.addEmergencyContact);

module.exports = router;
