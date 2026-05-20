const Doctor = require("../models/Doctor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/security");

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      specialty,
      phone,
      years_experience,
      clinic_name,
      clinic_address,
      clinic_city,
      clinic_phone,
    } = req.body;

    if (!name || !email || !password || !clinic_name || !clinic_city) {
      return res.status(400).json({
        error: "Nom, email, mot de passe, cabinet et ville sont requis",
      });
    }

    const existing = await Doctor.findByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const doctor = await Doctor.create({
      hospital_id: process.env.DEFAULT_HOSPITAL_ID || 1,
      name,
      email,
      password_hash,
      specialty: specialty || "Pédiatrie",
      phone,
      years_experience,
      clinic_name,
      clinic_address,
      clinic_city,
      clinic_phone,
    });

    const token = jwt.sign(
      { id: doctor.id, email: doctor.email, role: "doctor" },
      getJwtSecret(),
      { expiresIn: "7d" },
    );

    res.status(201).json({ message: "Médecin créé", token, doctor });
  } catch (error) {
    console.error("Erreur register doctor:", error);
    res.status(500).json({ error: "Erreur lors de l'inscription médecin" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const doctor = await Doctor.findByEmail(email);
    if (!doctor || !doctor.password_hash) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: doctor.id, email: doctor.email, role: "doctor" },
      getJwtSecret(),
      { expiresIn: "7d" },
    );

    delete doctor.password_hash;
    res.json({ message: "Connexion réussie", token, doctor });
  } catch (error) {
    console.error("Erreur login doctor:", error);
    res.status(500).json({ error: "Erreur lors de la connexion médecin" });
  }
};

// Récupérer tous les médecins
exports.getAll = async (req, res) => {
  try {
    const doctors = await Doctor.getByHospital(
      process.env.DEFAULT_HOSPITAL_ID || 1,
    );
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
};

// Récupérer détails médecin
exports.getById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: "Médecin non trouvé" });
    }
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctor.id);
    if (!doctor) {
      return res.status(404).json({ error: "Médecin non trouvé" });
    }
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const doctor = await Doctor.updateProfile(req.doctor.id, req.body);
    res.json({ message: "Profil médecin mis à jour", doctor });
  } catch (error) {
    console.error("Erreur update doctor:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
};

// Récupérer disponibilité médecin
exports.getAvailability = async (req, res) => {
  try {
    const availability = await Doctor.getAvailability(req.params.id);
    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
};

exports.getPrivateClinics = async (req, res) => {
  try {
    const clinics = await Doctor.getPrivateClinics();
    res.json(clinics);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
};
