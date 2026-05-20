const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/security");

const doctorAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token médecin manquant" });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded.role !== "doctor") {
      return res.status(403).json({ error: "Accès médecin requis" });
    }

    req.doctor = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token médecin invalide" });
  }
};

module.exports = doctorAuth;
