const Incident = require("../models/Incident");
const Audit = require("../models/Audit");

exports.list = async (req, res) => {
  try {
    const incidents = await Incident.listBySchool(req.currentUser.school_id, req.query);
    res.json({ incidents });
  } catch (error) {
    console.error("Erreur incidents:", error);
    res.status(500).json({ error: "Erreur incidents" });
  }
};

exports.createForStudent = async (req, res) => {
  try {
    if (!req.body.title) return res.status(400).json({ error: "Titre requis" });
    const incident = await Incident.create(
      req.params.id,
      req.currentUser.school_id,
      req.body,
      req.currentUser.id,
    );
    if (!incident) return res.status(404).json({ error: "Élève introuvable" });
    await Audit.log({
      req,
      action: "INCIDENT_CREATED",
      studentId: incident.student_id,
      entityType: "incident",
      entityId: incident.id,
      metadata: { severity: incident.severity, incident_type: incident.incident_type },
    });
    res.status(201).json({ incident });
  } catch (error) {
    console.error("Erreur création incident:", error);
    res.status(500).json({ error: "Erreur création incident" });
  }
};

exports.getById = async (req, res) => {
  try {
    const incident = await Incident.findByIdForSchool(
      req.params.id,
      req.currentUser.school_id,
    );
    if (!incident) return res.status(404).json({ error: "Incident introuvable" });
    const actions = await Incident.getActions(incident.id, req.currentUser.school_id);
    res.json({ incident, actions });
  } catch (error) {
    res.status(500).json({ error: "Erreur incident" });
  }
};

exports.update = async (req, res) => {
  try {
    const incident = await Incident.update(
      req.params.id,
      req.currentUser.school_id,
      req.body,
      req.currentUser.id,
    );
    if (!incident) return res.status(404).json({ error: "Incident introuvable" });
    await Audit.log({
      req,
      action: "INCIDENT_UPDATED",
      studentId: incident.student_id,
      entityType: "incident",
      entityId: incident.id,
      metadata: { status: incident.status },
    });
    res.json({ incident });
  } catch (error) {
    console.error("Erreur update incident:", error);
    res.status(500).json({ error: "Erreur mise à jour incident" });
  }
};

exports.addAction = async (req, res) => {
  try {
    if (!req.body.description) {
      return res.status(400).json({ error: "Description requise" });
    }
    const action = await Incident.addAction(
      req.params.id,
      req.currentUser.school_id,
      req.body,
      req.currentUser.id,
    );
    if (!action) return res.status(404).json({ error: "Incident introuvable" });
    await Audit.log({
      req,
      action: "INCIDENT_ACTION_ADDED",
      entityType: "incident",
      entityId: Number(req.params.id),
      metadata: { action_type: action.action_type },
    });
    res.status(201).json({ action });
  } catch (error) {
    res.status(500).json({ error: "Erreur action incident" });
  }
};
