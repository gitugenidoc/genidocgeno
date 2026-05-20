const EmergencyQr = require("../models/EmergencyQr");
const Audit = require("../models/Audit");

exports.createQr = async (req, res) => {
  try {
    const qr = await EmergencyQr.create(
      req.params.id,
      req.currentUser.school_id,
      req.currentUser.id,
      req,
    );
    if (!qr) return res.status(404).json({ error: "Élève introuvable" });
    await Audit.log({
      req,
      action: "QR_CREATED",
      studentId: Number(req.params.id),
      entityType: "qr_token",
      entityId: qr.id,
    });
    res.status(201).json({ qr });
  } catch (error) {
    console.error("Erreur QR urgence:", error);
    res.status(500).json({ error: "Erreur QR urgence" });
  }
};

exports.getActiveQr = async (req, res) => {
  try {
    const qr = await EmergencyQr.getActive(req.params.id, req.currentUser.school_id);
    if (qr === null) return res.json({ qr: null });
    res.json({ qr });
  } catch (error) {
    res.status(500).json({ error: "Erreur QR urgence" });
  }
};

exports.revokeQr = async (req, res) => {
  try {
    const qr = await EmergencyQr.revoke(
      req.params.id,
      req.currentUser.school_id,
      req.currentUser.id,
    );
    await Audit.log({
      req,
      action: "QR_REVOKED",
      studentId: Number(req.params.id),
      entityType: "qr_token",
      entityId: qr?.id || null,
    });
    res.json({ message: "QR urgence révoqué", qr });
  } catch (error) {
    res.status(500).json({ error: "Erreur révocation QR" });
  }
};

exports.resolve = async (req, res) => {
  try {
    const data = await EmergencyQr.resolve(req.params.token, req);
    if (!data) {
      await Audit.log({
        req,
        action: "QR_SCANNED",
        status: "failure",
        metadata: { reason: "invalid_or_expired" },
      });
      return res.status(404).json({ error: "QR urgence invalide ou expiré" });
    }
    await Audit.log({
      req,
      action: "QR_SCANNED",
      schoolId: data.student.school_id,
      studentId: data.student.id,
      entityType: "student",
      entityId: data.student.id,
    });
    res.json(data);
  } catch (error) {
    console.error("Erreur résolution urgence:", error);
    res.status(500).json({ error: "Erreur accès urgence" });
  }
};
