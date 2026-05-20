const MedicalRecord = require("../models/MedicalRecord");
const Appointment = require("../models/Appointment");

// Créer dossier médical
exports.create = async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      appointment_id,
      visit_date,
      reason_for_visit,
      symptoms,
      diagnosis,
      treatment,
      medications,
    } = req.body;

    const record = await MedicalRecord.create({
      patient_id,
      doctor_id,
      hospital_id: process.env.DEFAULT_HOSPITAL_ID || 1,
      appointment_id,
      visit_date,
      reason_for_visit,
      symptoms,
      diagnosis,
      treatment,
      medications,
    });

    res.status(201).json({
      message: "Dossier médical créé",
      record,
    });
  } catch (error) {
    console.error("Erreur create record:", error);
    res.status(500).json({ error: "Erreur lors de la création" });
  }
};

// Récupérer mon dossier médical
exports.getMyRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.getByPatient(req.user.id);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
};

// Récupérer un dossier par ID
exports.getById = async (req, res) => {
  try {
    const record = await MedicalRecord.getById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: "Dossier non trouvé" });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
};

// Mettre à jour dossier
exports.update = async (req, res) => {
  try {
    const record = await MedicalRecord.update(req.params.id, req.body);
    res.json({ message: "Dossier mis à jour", record });
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
};

// Récupérer dossier par RDV
exports.getByAppointment = async (req, res) => {
  try {
    const record = await MedicalRecord.getByAppointment(
      req.params.appointment_id,
    );
    if (!record) {
      return res.status(404).json({ error: "Aucun dossier pour ce RDV" });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
};
