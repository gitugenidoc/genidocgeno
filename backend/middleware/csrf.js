const crypto = require("crypto");

/**
 * CSRF (Cross-Site Request Forgery) Protection Middleware
 *
 * Protège contre les attaques CSRF en validant les tokens CSRF
 * et en utilisant SameSite cookies
 */

class CsrfProtection {
  constructor(options = {}) {
    this.tokenSize = options.tokenSize || 32;
    this.fieldName = options.fieldName || "_csrf";
    this.cookieName = options.cookieName || "csrf-token";
    this.headerName = options.headerName || "X-CSRF-Token";
  }

  /**
   * Génère un nouveau token CSRF
   */
  generateToken() {
    return crypto.randomBytes(this.tokenSize).toString("hex");
  }

  /**
   * Middleware pour générer et valider les tokens CSRF
   */
  middleware() {
    return (req, res, next) => {
      // Stocke le token dans la session
      if (!req.session) {
        req.session = {};
      }

      // Génère un token si n'existe pas
      if (!req.session.csrfToken) {
        req.session.csrfToken = this.generateToken();
      }

      // Ajoute le token à res.locals pour les templates
      res.locals.csrfToken = req.session.csrfToken;

      // Ajoute une méthode pour accéder au token
      res.csrfToken = () => req.session.csrfToken;

      // Validez le token pour les requêtes non-GET
      if (!this.isReadonlyMethod(req.method)) {
        const token = this.extractToken(req);

        if (!token || token !== req.session.csrfToken) {
          console.warn(
            `[SECURITY] CSRF Token Invalid: ${req.method} ${req.path} from ${req.ip}`,
          );
          return res.status(403).json({
            error: "CSRF Token invalide ou manquant",
            code: "CSRF_INVALID",
          });
        }
      }

      next();
    };
  }

  /**
   * Extrait le token CSRF de la requête
   */
  extractToken(req) {
    // Cherche dans l'ordre: headers -> body -> query
    return (
      req.get(this.headerName) ||
      (req.body && req.body[this.fieldName]) ||
      req.query[this.fieldName]
    );
  }

  /**
   * Vérifie si la méthode n'a pas besoin de validation CSRF
   */
  isReadonlyMethod(method) {
    // Les méthodes sûres n'ont pas besoin de protection CSRF
    return ["GET", "HEAD", "OPTIONS"].includes(method);
  }
}

/**
 * Middleware SameSite Cookie Protection
 * Empêche les cookies d'être envoyés en cross-site requests
 */
const sameSiteCookieMiddleware = (req, res, next) => {
  // Override res.cookie pour ajouter SameSite=Strict
  const originalCookie = res.cookie.bind(res);

  res.cookie = function (name, value, options = {}) {
    // Ajoute SameSite=Strict par défaut
    if (!options.sameSite) {
      options.sameSite = "Strict";
    }

    // Force Secure en production
    if (process.env.NODE_ENV === "production" && !options.secure) {
      options.secure = true;
    }

    // Force HttpOnly
    if (typeof options.httpOnly === "undefined") {
      options.httpOnly = true;
    }

    return originalCookie(name, value, options);
  };

  next();
};

/**
 * Validation d'origine (Origin/Referer)
 * Vérifie que les requêtes POST viennent du même domaine
 */
const originValidationMiddleware = (req, res, next) => {
  // Ignorer pour les méthodes sûres
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const origin = req.get("origin");
  const referer = req.get("referer");

  // Construire l'URL attendue
  const protocol = req.get("x-forwarded-proto") || "http";
  const host = req.get("host");
  const expectedOrigin = `${protocol}://${host}`;

  // Valider l'origin
  if (origin && origin !== expectedOrigin) {
    console.warn(
      `[SECURITY] Origin mismatch: Expected ${expectedOrigin}, got ${origin}`,
    );
    return res.status(403).json({
      error: "Origine non autorisée",
      code: "ORIGIN_MISMATCH",
    });
  }

  // Valider le referer si présent
  if (referer && !referer.startsWith(expectedOrigin)) {
    console.warn(
      `[SECURITY] Referer mismatch: Expected ${expectedOrigin}, got ${referer}`,
    );
    // Ne pas rejeter ici, seulement logger (certains navigateurs n'envoient pas Referer)
  }

  next();
};

/**
 * Double Submit Cookie Pattern
 * Ajoute une couche supplémentaire de protection
 */
const doubleSubmitCookieMiddleware = (req, res, next) => {
  // Génère un token
  const token = crypto.randomBytes(32).toString("hex");

  // Stocke en cookie
  res.cookie("X-CSRF-TOKEN", token, {
    httpOnly: false, // Permet à JavaScript de lire
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 3600000, // 1 heure
  });

  // Stocke aussi en session
  if (!req.session) req.session = {};
  req.session.doubleSubmitToken = token;

  next();
};

/**
 * Validation Double Submit Cookie
 */
const validateDoubleSubmitCookie = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const headerToken = req.get("X-CSRF-TOKEN");
  const cookieToken = req.cookies?.["X-CSRF-TOKEN"];
  const sessionToken = req.session?.doubleSubmitToken;

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    console.warn(
      `[SECURITY] Double Submit Cookie validation failed from ${req.ip}`,
    );
    return res.status(403).json({
      error: "Double Submit Cookie validation échouée",
      code: "DOUBLE_SUBMIT_INVALID",
    });
  }

  if (sessionToken && sessionToken !== cookieToken) {
    console.warn(
      `[SECURITY] Session mismatch in Double Submit Cookie from ${req.ip}`,
    );
    return res.status(403).json({
      error: "Session CSRF invalide",
      code: "SESSION_CSRF_MISMATCH",
    });
  }

  next();
};

/**
 * Middleware de validation de requête (AJAX/API)
 * Vérifie les headers spécifiques aux requêtes AJAX
 */
const ajaxValidationMiddleware = (req, res, next) => {
  // Les requêtes AJAX ont généralement cet header
  const isAjax =
    req.get("X-Requested-With") === "XMLHttpRequest" ||
    req.get("Accept") === "application/json" ||
    req.get("Content-Type")?.includes("application/json");

  // Pour les API JSON, la validation du token est stricte
  if (isAjax && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const token = req.get("X-CSRF-Token");

    if (!token) {
      return res.status(403).json({
        error: "CSRF Token requis pour les requêtes JSON",
        code: "CSRF_TOKEN_REQUIRED",
      });
    }
  }

  next();
};

// ========================
// EXPORT
// ========================

module.exports = {
  CsrfProtection,
  sameSiteCookieMiddleware,
  originValidationMiddleware,
  doubleSubmitCookieMiddleware,
  validateDoubleSubmitCookie,
  ajaxValidationMiddleware,
};
