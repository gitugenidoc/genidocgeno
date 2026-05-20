const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const AuthUser = require("../models/AuthUser");
const Audit = require("../models/Audit");
const AccountSecurity = require("../models/AccountSecurity");
const {
  signSessionToken,
  verifySessionToken,
  hashToken,
  readCookie,
  setSessionCookie,
  clearSessionCookie,
} = require("../utils/sessionToken");

function publicUser(user, roles, permissions = []) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    school_id: user.school_id,
    role: roles[0]?.code || null,
    roles: roles.map((role) => role.code),
    permissions: permissions.map((permission) => permission.code),
  };
}

function roleRedirect(role) {
  const redirects = {
    SCHOOL_ADMIN: "/app/school/dashboard.html",
    SCHOOL_NURSE: "/app/school/students.html",
    PARENT: "/app/parent/dashboard.html",
    PEDIATRICIAN: "/app/doctor/dashboard.html",
    GENIDOC_ADMIN: "/app/admin/dashboard.html",
    PLATFORM_OWNER: "/app/admin/dashboard.html",
  };
  return redirects[role] || "/app/auth/login.html";
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const user = await AuthUser.findByEmail(email);
    if (!user || user.status !== "active") {
      await Audit.log({
        req,
        action: "LOGIN_FAILURE",
        status: "failure",
        metadata: { email },
      });
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      await Audit.log({
        req,
        action: "LOGIN_FAILURE",
        status: "failure",
        schoolId: user.school_id,
        userId: user.id,
        metadata: { email },
      });
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const roles = await AuthUser.getRoles(user.id);
    const permissions = await AuthUser.getPermissions(user.id);
    const primaryRole = roles[0]?.code;
    const token = signSessionToken({
      type: "app_session",
      sid: randomUUID(),
      user_id: user.id,
      email: user.email,
      roles: roles.map((role) => role.code),
    });

    await AuthUser.createSession({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers["user-agent"] || null,
      ipAddress: req.ip || req.socket?.remoteAddress || null,
    });

    setSessionCookie(res, token);
    await Audit.log({
      req,
      action: "LOGIN_SUCCESS",
      schoolId: user.school_id,
      userId: user.id,
      entityType: "user",
      entityId: user.id,
      metadata: { role: primaryRole },
    });
    res.json({
      message: "Connexion réussie",
      user: publicUser(user, roles, permissions),
      redirect_to: roleRedirect(primaryRole),
    });
  } catch (error) {
    console.error("Erreur auth login:", error);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.currentUser });
};

exports.permissions = async (req, res) => {
  try {
    const permissions = await AuthUser.getPermissions(req.currentUser.id);
    res.json({ permissions });
  } catch (error) {
    res.status(500).json({ error: "Erreur permissions" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    if (req.body?.email) {
      await AccountSecurity.createPasswordReset(req.body.email);
    }
    res.json({ message: "Si le compte existe, un email de reinitialisation sera envoye." });
  } catch (error) {
    console.error("Erreur forgot password:", error);
    res.status(500).json({ error: "Erreur reinitialisation" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const ok = await AccountSecurity.resetPassword(req.body?.token, req.body?.password);
    if (!ok) return res.status(400).json({ error: "Lien invalide ou mot de passe trop faible" });
    res.json({ message: "Mot de passe mis a jour" });
  } catch (error) {
    console.error("Erreur reset password:", error);
    res.status(500).json({ error: "Erreur reinitialisation" });
  }
};

exports.acceptInvitation = async (req, res) => {
  try {
    const user = await AccountSecurity.acceptInvitation(req.body?.token, req.body?.password);
    if (!user) return res.status(400).json({ error: "Invitation invalide ou expiree" });
    res.status(201).json({ message: "Compte active", user: { email: user.email } });
  } catch (error) {
    console.error("Erreur invitation:", error);
    res.status(500).json({ error: "Erreur activation" });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = readCookie(req);
    if (token) {
      try {
        verifySessionToken(token);
        await AuthUser.revokeSession(hashToken(token));
      } catch {
        // Cookie already invalid: clearing it is enough.
      }
    }
    clearSessionCookie(res);
    res.json({ message: "Déconnexion réussie" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la déconnexion" });
  }
};
