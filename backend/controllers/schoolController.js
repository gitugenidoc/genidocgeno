const School = require("../models/School");

exports.getCurrentSchool = async (req, res) => {
  try {
    const school = await School.getById(req.currentUser.school_id);
    if (!school) return res.status(404).json({ error: "École introuvable" });
    const stats = await School.getDashboardStats(school.id);
    res.json({ school, stats });
  } catch (error) {
    console.error("Erreur école:", error);
    res.status(500).json({ error: "Erreur école" });
  }
};

exports.listSchools = async (req, res) => {
  try {
    const schools = await School.listAll();
    res.json({ schools });
  } catch (error) {
    console.error("Erreur liste ecoles:", error);
    res.status(500).json({ error: "Erreur liste ecoles" });
  }
};

exports.createSchool = async (req, res) => {
  try {
    const { name, admin } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Nom de l'ecole requis" });
    }

    const school = await School.createSchool(req.body);
    let schoolAdmin = null;

    if (admin?.email && admin?.first_name && admin?.last_name && admin?.password) {
      schoolAdmin = await School.createSchoolAdmin({
        schoolId: school.id,
        email: admin.email,
        firstName: admin.first_name,
        lastName: admin.last_name,
        password: admin.password,
      });
    }

    res.status(201).json({ school, admin: schoolAdmin });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email deja utilise" });
    }
    console.error("Erreur creation ecole:", error);
    res.status(500).json({ error: "Erreur creation ecole" });
  }
};

exports.getClasses = async (req, res) => {
  try {
    const schoolId = Number(req.params.id);
    if (schoolId !== req.currentUser.school_id) {
      return res.status(403).json({ error: "Accès école interdit" });
    }
    const classes = await School.getClasses(schoolId);
    res.json({ classes });
  } catch (error) {
    res.status(500).json({ error: "Erreur classes" });
  }
};

exports.createClass = async (req, res) => {
  try {
    const schoolId = Number(req.params.id);
    if (schoolId !== req.currentUser.school_id) {
      return res.status(403).json({ error: "Accès école interdit" });
    }
    if (!req.body.name) {
      return res.status(400).json({ error: "Nom de classe requis" });
    }
    const schoolClass = await School.createClass(schoolId, req.body, req.currentUser.id);
    res.status(201).json({ class: schoolClass });
  } catch (error) {
    console.error("Erreur création classe:", error);
    res.status(500).json({ error: "Erreur création classe" });
  }
};
