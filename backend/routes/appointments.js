const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const auth = require("../middleware/auth");

// Créer RDV
router.post("/", auth, appointmentController.create);

// Récupérer mes RDVs
router.get("/my-appointments", auth, appointmentController.getMyAppointments);

// RDVs disponibles
router.get("/available", appointmentController.getAvailable);

// Récupérer RDV par ID
router.get("/:id", auth, appointmentController.getById);

// Confirmer RDV
router.put("/:id/confirm", auth, appointmentController.confirm);

// Annuler RDV
router.delete("/:id", auth, appointmentController.cancel);

// RDVs d'un médecin
router.get("/doctor/:doctor_id", appointmentController.getDoctorAppointments);

module.exports = router;
