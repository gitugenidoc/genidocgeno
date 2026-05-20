const Document = require("../models/Document");
const Audit = require("../models/Audit");

function validateUpload(body) {
  if (!body.filename || !body.content_base64) {
    return "Fichier requis";
  }
  const bytes = Buffer.byteLength(body.content_base64, "base64");
  if (bytes > 6 * 1024 * 1024) {
    return "Fichier trop volumineux pour la V1";
  }
  return null;
}

exports.listForStudent = async (req, res) => {
  try {
    const documents = await Document.listForStudent(req.params.id, req.currentUser);
    if (!documents) return res.status(404).json({ error: "Élève introuvable" });
    res.json({ documents });
  } catch (error) {
    console.error("Erreur documents:", error);
    res.status(500).json({ error: "Erreur documents" });
  }
};

exports.uploadForStudent = async (req, res) => {
  try {
    const validation = validateUpload(req.body);
    if (validation) return res.status(400).json({ error: validation });

    const document = await Document.createForStudent(
      req.params.id,
      req.currentUser,
      req.body,
    );
    if (!document) return res.status(404).json({ error: "Élève introuvable" });
    await Audit.log({
      req,
      action: "DOCUMENT_UPLOADED",
      schoolId: document.school_id,
      studentId: document.student_id,
      entityType: "document",
      entityId: document.id,
      metadata: { document_type: document.document_type },
    });
    res.status(201).json({ document });
  } catch (error) {
    console.error("Erreur upload document:", error);
    res.status(500).json({ error: "Erreur upload document" });
  }
};

exports.download = async (req, res) => {
  try {
    const result = await Document.download(req.params.id, req.currentUser, req);
    if (!result) return res.status(404).json({ error: "Document introuvable" });
    await Audit.log({
      req,
      action: "DOCUMENT_DOWNLOADED",
      schoolId: result.document.school_id,
      studentId: result.document.student_id,
      entityType: "document",
      entityId: result.document.id,
    });

    res.setHeader("Content-Type", result.document.mime_type);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(result.document.original_filename)}"`,
    );
    res.send(result.buffer);
  } catch (error) {
    console.error("Erreur téléchargement document:", error);
    res.status(500).json({ error: "Erreur téléchargement document" });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Document.delete(req.params.id, req.currentUser);
    if (deleted === null) return res.status(404).json({ error: "Document introuvable" });
    if (deleted === false) return res.status(403).json({ error: "Suppression interdite" });
    res.json({ message: "Document supprimé" });
  } catch (error) {
    res.status(500).json({ error: "Erreur suppression document" });
  }
};
