const express = require("express");
const router = express.Router();
const medicalRecordController = require("../controllers/medicalRecordController");
const auth = require("../middleware/auth");

// Créer dossier
router.post("/", medicalRecordController.create);

// Récupérer mon dossier
router.get("/my-records", auth, medicalRecordController.getMyRecords);

// Récupérer dossier par ID
router.get("/:id", auth, medicalRecordController.getById);

// Mettre à jour dossier
router.put("/:id", medicalRecordController.update);

// Récupérer dossier par RDV
router.get(
  "/appointment/:appointment_id",
  medicalRecordController.getByAppointment,
);

module.exports = router;
