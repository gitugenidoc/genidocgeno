const AuthUser = require("../models/AuthUser");
const {
  verifySessionToken,
  hashToken,
  readCookie,
} = require("../utils/sessionToken");

async function requireAuth(req, res, next) {
  try {
    const token = readCookie(req);
    if (!token) {
      return res.status(401).json({ error: "Session requise" });
    }

    const decoded = verifySessionToken(token);
    if (decoded.type !== "app_session") {
      return res.status(401).json({ error: "Session invalide" });
    }

    const session = await AuthUser.findActiveSession(hashToken(token));
    if (!session) {
      return res.status(401).json({ error: "Session expirée" });
    }

    const user = await AuthUser.findById(decoded.user_id);
    if (!user || user.status !== "active") {
      return res.status(401).json({ error: "Utilisateur désactivé" });
    }

    const roles = await AuthUser.getRoles(user.id);
    req.currentUser = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      school_id: user.school_id,
      role: roles[0]?.code || null,
      roles: roles.map((role) => role.code),
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Session invalide" });
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    const roles = req.currentUser?.roles || [];
    const allowed = roles.some((role) => allowedRoles.includes(role));
    if (!allowed) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
