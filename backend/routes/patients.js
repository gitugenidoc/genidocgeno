const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const auth = require("../middleware/auth");

// Authentification
router.post("/register", patientController.register);
router.post("/login", patientController.login);

// Profil
router.get("/profile", auth, patientController.getProfile);
router.put("/profile", auth, patientController.updateProfile);

// Admin
router.get("/", patientController.getAll);

module.exports = router;
