const Audit = require("../models/Audit");

exports.list = async (req, res) => {
  try {
    const allowed = req.currentUser.roles.includes("PLATFORM_OWNER");
    if (!allowed) return res.status(403).json({ error: "Accès audit interdit" });

    const events = await Audit.listForUser(req.currentUser, req.query);
    res.json({ events });
  } catch (error) {
    console.error("Erreur audit list:", error);
    res.status(500).json({ error: "Erreur audit" });
  }
};
