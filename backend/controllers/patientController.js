const Patient = require("../models/Patient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/security");

// Enregistrement patient
exports.register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, date_of_birth } =
      req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: "Champs requis manquants" });
    }

    // Vérifier si patient existe
    const existing = await Patient.findByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Créer patient
    const patient = await Patient.create({
      hospital_id: process.env.DEFAULT_HOSPITAL_ID || 1,
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      date_of_birth,
    });

    // Générer token JWT
    const token = jwt.sign(
      { id: patient.id, email: patient.email },
      getJwtSecret(),
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "Patient créé avec succès",
      token,
      patient: { id: patient.id, email: patient.email, first_name, last_name },
    });
  } catch (error) {
    console.error("Erreur register:", error);
    res.status(500).json({ error: "Erreur lors de l'enregistrement" });
  }
};

// Login patient
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const patient = await Patient.findByEmail(email);
    if (!patient) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const isMatch = await bcrypt.compare(password, patient.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: patient.id, email: patient.email },
      getJwtSecret(),
      { expiresIn: "7d" },
    );

    res.json({
      message: "Connexion réussie",
      token,
      patient: {
        id: patient.id,
        email: patient.email,
        first_name: patient.first_name,
        last_name: patient.last_name,
      },
    });
  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
};

// Récupérer profil patient
exports.getProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({ error: "Patient non trouvé" });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
};

// Mettre à jour profil
exports.updateProfile = async (req, res) => {
  try {
    const patient = await Patient.update(req.user.id, req.body);
    res.json({ message: "Profil mis à jour", patient });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
};

// Lister tous les patients (admin)
exports.getAll = async (req, res) => {
  try {
    const patients = await Patient.getAll(process.env.DEFAULT_HOSPITAL_ID || 1);
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
};
