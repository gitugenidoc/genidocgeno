const SchoolStudent = require("../models/SchoolStudent");

function canWrite(req) {
  return req.currentUser.roles.some((role) => ["SCHOOL_ADMIN"].includes(role));
}

exports.list = async (req, res) => {
  try {
    const students = await SchoolStudent.listBySchool(req.currentUser.school_id, {
      class_id: req.query.class_id,
      search: req.query.search,
    });
    res.json({ students });
  } catch (error) {
    console.error("Erreur liste élèves:", error);
    res.status(500).json({ error: "Erreur liste élèves" });
  }
};

exports.getById = async (req, res) => {
  try {
    const student = await SchoolStudent.findByIdForSchool(
      req.params.id,
      req.currentUser.school_id,
    );
    if (!student) return res.status(404).json({ error: "Élève introuvable" });

    const guardians = await SchoolStudent.getGuardians(student.id, req.currentUser.school_id);
    const emergency_contacts = await SchoolStudent.getEmergencyContacts(
      student.id,
      req.currentUser.school_id,
    );

    res.json({ student, guardians, emergency_contacts });
  } catch (error) {
    res.status(500).json({ error: "Erreur élève" });
  }
};

exports.create = async (req, res) => {
  try {
    if (!canWrite(req)) return res.status(403).json({ error: "Accès écriture interdit" });
    const { first_name, last_name } = req.body;
    if (!first_name || !last_name) {
      return res.status(400).json({ error: "Prénom et nom requis" });
    }
    const student = await SchoolStudent.create(
      req.currentUser.school_id,
      req.body,
      req.currentUser.id,
    );
    res.status(201).json({ student });
  } catch (error) {
    console.error("Erreur création élève:", error);
    res.status(500).json({ error: "Erreur création élève" });
  }
};

exports.update = async (req, res) => {
  try {
    if (!canWrite(req)) return res.status(403).json({ error: "Accès écriture interdit" });
    const student = await SchoolStudent.update(
      req.params.id,
      req.currentUser.school_id,
      req.body,
      req.currentUser.id,
    );
    if (!student) return res.status(404).json({ error: "Élève introuvable" });
    res.json({ student });
  } catch (error) {
    res.status(500).json({ error: "Erreur mise à jour élève" });
  }
};

exports.addGuardian = async (req, res) => {
  try {
    if (!canWrite(req)) return res.status(403).json({ error: "Accès écriture interdit" });
    if (!req.body.first_name || !req.body.last_name) {
      return res.status(400).json({ error: "Prénom et nom du tuteur requis" });
    }
    const guardian = await SchoolStudent.addGuardian(
      req.params.id,
      req.currentUser.school_id,
      req.body,
      req.currentUser.id,
    );
    if (!guardian) return res.status(404).json({ error: "Élève introuvable" });
    res.status(201).json({ guardian });
  } catch (error) {
    console.error("Erreur tuteur:", error);
    res.status(500).json({ error: "Erreur tuteur" });
  }
};

exports.addEmergencyContact = async (req, res) => {
  try {
    if (!canWrite(req)) return res.status(403).json({ error: "Accès écriture interdit" });
    if (!req.body.name || !req.body.phone) {
      return res.status(400).json({ error: "Nom et téléphone requis" });
    }
    const emergency_contact = await SchoolStudent.addEmergencyContact(
      req.params.id,
      req.currentUser.school_id,
      req.body,
      req.currentUser.id,
    );
    if (!emergency_contact) return res.status(404).json({ error: "Élève introuvable" });
    res.status(201).json({ emergency_contact });
  } catch (error) {
    console.error("Erreur contact urgence:", error);
    res.status(500).json({ error: "Erreur contact urgence" });
  }
};
