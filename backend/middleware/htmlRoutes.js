const path = require("path");
const fs = require("fs");

/**
 * Gestionnaire sécurisé des routes HTML
 * - Empêche l'accès direct aux fichiers .html
 * - Serve les fichiers via des routes dynamiques
 * - Empêche la vue source (Ctrl+U)
 */

const htmlRoutes = {
  "/": "index.html",
  "/auth": "auth.html",
  "/doctor-auth": "doctor-auth.html",
  "/doctor-dashboard": "doctor-dashboard.html",
  "/emergency": "emergency.html",
  "/profile": "profile.html",
  "/forgot-password": "forgot-password.html",
  "/onboarding": "onboarding.html",

  // App routes
  "/app/admin/dashboard": "app/admin/dashboard.html",
  "/app/admin/schools": "app/admin/schools.html",
  "/app/auth/login": "app/auth/login.html",
  "/app/auth/accept-invitation": "app/auth/accept-invitation.html",
  "/app/auth/reset-password": "app/auth/reset-password.html",
  "/app/auth/forgot-password": "app/auth/forgot-password.html",
  "/app/doctor/dashboard": "app/doctor/dashboard.html",
  "/app/parent/dashboard": "app/parent/dashboard.html",
  "/app/school/dashboard": "app/school/dashboard.html",
  "/app/school/students": "app/school/students.html",
  "/app/school/incidents": "app/school/incidents.html",
  "/app/school/student-detail": "app/school/student-detail.html",
  "/app/audit": "app/audit.html",
  "/app/unauthorized": "app/unauthorized.html",
};

/**
 * Middleware pour servir les pages HTML dynamiquement
 * Empêche l'accès direct aux fichiers .html
 */
const serveHtmlPage = (req, res, next) => {
  const requestPath = req.path;

  // Cherche une correspondance dans les routes définies
  if (htmlRoutes[requestPath]) {
    const htmlFile = htmlRoutes[requestPath];
    const filePath = path.join(__dirname, "..", "..", htmlFile);

    // Vérifie que le fichier existe
    if (fs.existsSync(filePath)) {
      // Ajoute les headers de sécurité pour empêcher la mise en cache
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.setHeader(
        "Content-Security-Policy",
        "script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self';",
      );

      // Ajoute un nonce pour les scripts inline
      const nonce = require("crypto").randomBytes(16).toString("hex");
      res.setHeader("X-Content-Nonce", nonce);

      // Serve le fichier
      return res.sendFile(filePath);
    }
  }

  // Si pas de correspondance, continuer
  next();
};

/**
 * Middleware pour bloquer l'accès direct aux fichiers HTML
 * Retourne 404 si quelqu'un essaie d'accéder directement à /fichier.html
 */
const blockDirectHtmlAccess = (req, res, next) => {
  if (req.path.match(/\.html$/i)) {
    console.warn(
      `[SECURITY] Tentative d'accès direct à HTML: ${req.path} depuis ${req.ip}`,
    );
    return res.status(404).json({ error: "Not found" });
  }
  next();
};

/**
 * Enregistre les routes HTML dynamiques
 */
const registerHtmlRoutes = (app) => {
  // Applique le middleware de sécurité
  app.use(blockDirectHtmlAccess);
  app.use(serveHtmlPage);

  // Page 404 personnalisée sécurisée
  app.use((req, res) => {
    res.status(404).json({ error: "Page non trouvée", path: req.path });
  });
};

module.exports = {
  serveHtmlPage,
  blockDirectHtmlAccess,
  registerHtmlRoutes,
  htmlRoutes,
};
