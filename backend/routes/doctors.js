const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");
const doctorAuth = require("../middleware/doctorAuth");

router.post("/register", doctorController.register);
router.post("/login", doctorController.login);
router.get("/profile", doctorAuth, doctorController.getProfile);
router.put("/profile", doctorAuth, doctorController.updateProfile);
router.get("/private-clinics", doctorController.getPrivateClinics);

// Récupérer tous médecins
router.get("/", doctorController.getAll);

// Récupérer médecin par ID
router.get("/:id", doctorController.getById);

// Récupérer disponibilité
router.get("/:id/availability", doctorController.getAvailability);

module.exports = router;
