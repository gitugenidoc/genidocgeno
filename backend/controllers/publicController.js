const PublicLead = require("../models/PublicLead");

exports.status = async (req, res) => {
  res.json({
    status: "OK",
    product: "GeniDoc School Health",
    message: "Public API running",
  });
};

exports.contact = async (req, res) => {
  try {
    const { name, email, phone, organization, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Nom, email et message requis" });
    }

    const contact = await PublicLead.createContact({
      name,
      email,
      phone,
      organization,
      message,
    });

    res.status(201).json({ message: "Message reçu", contact });
  } catch (error) {
    console.error("Erreur contact public:", error);
    res.status(500).json({ error: "Erreur lors de l'envoi du message" });
  }
};

exports.demoRequest = async (req, res) => {
  try {
    const {
      school_name,
      contact_name,
      email,
      phone,
      city,
      students_count,
      message,
    } = req.body;

    if (!school_name || !contact_name || !email || !city) {
      return res.status(400).json({
        error: "École, contact, email et ville sont requis",
      });
    }

    const demo = await PublicLead.createDemoRequest({
      school_name,
      contact_name,
      email,
      phone,
      city,
      students_count,
      message,
    });

    res.status(201).json({ message: "Demande de démo reçue", demo });
  } catch (error) {
    console.error("Erreur demande demo:", error);
    res.status(500).json({ error: "Erreur lors de la demande de démo" });
  }
};
