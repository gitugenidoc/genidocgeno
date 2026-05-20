const ParentPortal = require("../models/ParentPortal");

exports.getChildren = async (req, res) => {
  try {
    const children = await ParentPortal.getChildrenForUser(req.currentUser);
    res.json({ children });
  } catch (error) {
    console.error("Erreur enfants parent:", error);
    res.status(500).json({ error: "Erreur enfants parent" });
  }
};

exports.getChildHealth = async (req, res) => {
  try {
    const data = await ParentPortal.getHealthProfile(req.params.id, req.currentUser);
    if (!data) return res.status(404).json({ error: "Enfant introuvable" });
    res.json(data);
  } catch (error) {
    console.error("Erreur fiche santé parent:", error);
    res.status(500).json({ error: "Erreur fiche santé parent" });
  }
};

exports.updateChildHealth = async (req, res) => {
  try {
    const data = await ParentPortal.updateHealthProfile(
      req.params.id,
      req.currentUser,
      req.body,
    );
    if (!data) return res.status(404).json({ error: "Enfant introuvable" });
    res.json({ message: "Fiche santé mise à jour", ...data });
  } catch (error) {
    console.error("Erreur mise à jour santé parent:", error);
    res.status(500).json({ error: "Erreur mise à jour fiche santé" });
  }
};

exports.getAuthorizations = async (req, res) => {
  try {
    const data = await ParentPortal.getAuthorizations(req.params.id, req.currentUser);
    if (!data) return res.status(404).json({ error: "Enfant introuvable" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erreur autorisations" });
  }
};

exports.updateAuthorizations = async (req, res) => {
  try {
    const data = await ParentPortal.updateAuthorizations(
      req.params.id,
      req.currentUser,
      req.body,
    );
    if (!data) return res.status(404).json({ error: "Enfant introuvable" });
    res.json({ message: "Autorisations mises à jour", ...data });
  } catch (error) {
    console.error("Erreur update autorisations:", error);
    res.status(500).json({ error: "Erreur mise à jour autorisations" });
  }
};
