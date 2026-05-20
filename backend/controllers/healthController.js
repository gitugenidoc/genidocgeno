const HealthProfile = require("../models/HealthProfile");
const Audit = require("../models/Audit");

function canAccessHealth(req) {
  return req.currentUser.roles.some((role) =>
    ["SCHOOL_ADMIN", "SCHOOL_NURSE"].includes(role),
  );
}

function canWriteHealth(req) {
  return req.currentUser.roles.some((role) =>
    ["SCHOOL_ADMIN", "SCHOOL_NURSE"].includes(role),
  );
}

exports.getProfile = async (req, res) => {
  try {
    if (!canAccessHealth(req)) {
      return res.status(403).json({ error: "Accès santé interdit" });
    }
    const data = await HealthProfile.get(req.params.id, req.currentUser.school_id);
    if (!data) return res.status(404).json({ error: "Élève introuvable" });
    await Audit.log({
      req,
      action: "HEALTH_PROFILE_VIEWED",
      studentId: Number(req.params.id),
      entityType: "student",
      entityId: Number(req.params.id),
    });
    res.json(data);
  } catch (error) {
    console.error("Erreur fiche santé:", error);
    res.status(500).json({ error: "Erreur fiche santé" });
  }
};

exports.upsertProfile = async (req, res) => {
  try {
    if (!canWriteHealth(req)) {
      return res.status(403).json({ error: "Modification santé interdite" });
    }
    const data = await HealthProfile.upsert(
      req.params.id,
      req.currentUser.school_id,
      req.body,
      req.currentUser.id,
    );
    if (!data) return res.status(404).json({ error: "Élève introuvable" });
    await Audit.log({
      req,
      action: "HEALTH_PROFILE_UPDATED",
      studentId: Number(req.params.id),
      entityType: "student",
      entityId: Number(req.params.id),
    });
    res.json({ message: "Fiche santé mise à jour", ...data });
  } catch (error) {
    console.error("Erreur mise à jour fiche santé:", error);
    res.status(500).json({ error: "Erreur mise à jour fiche santé" });
  }
};
