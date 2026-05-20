const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

// Créer un RDV
exports.create = async (req, res) => {
  try {
    const { doctor_id, appointment_date, appointment_time, reason } = req.body;

    if (!doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: "Champs requis manquants" });
    }

    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) {
      return res.status(404).json({ error: "Médecin non trouvé" });
    }

    const appointment = await Appointment.create({
      patient_id: req.user.id,
      doctor_id,
      hospital_id: process.env.DEFAULT_HOSPITAL_ID || 1,
      appointment_date,
      appointment_time,
      reason,
    });

    res.status(201).json({
      message: "RDV créé avec succès",
      appointment,
    });
  } catch (error) {
    console.error("Erreur create appointment:", error);
    res.status(500).json({ error: "Erreur lors de la création du RDV" });
  }
};

// Récupérer mes RDVs
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.getByPatient(req.user.id);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
};

// Récupérer un RDV par ID
exports.getById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: "RDV non trouvé" });
    }
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
};

// Annuler un RDV
exports.cancel = async (req, res) => {
  try {
    const appointment = await Appointment.cancel(req.params.id);
    res.json({ message: "RDV annulé", appointment });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'annulation" });
  }
};

// Confirmer un RDV
exports.confirm = async (req, res) => {
  try {
    const appointment = await Appointment.updateStatus(
      req.params.id,
      "confirmed",
    );
    res.json({ message: "RDV confirmé", appointment });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la confirmation" });
  }
};

// Récupérer RDVs disponibles
exports.getAvailable = async (req, res) => {
  try {
    const { appointment_date } = req.query;

    if (!appointment_date) {
      return res.status(400).json({ error: "Date requise" });
    }

    const available = await Appointment.getAvailable(
      process.env.DEFAULT_HOSPITAL_ID || 1,
      appointment_date,
    );
    res.json(available);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
};

// Récupérer RDVs d'un médecin
exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.getByDoctor(req.params.doctor_id);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
};
