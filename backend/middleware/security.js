const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

// ========================
// SECURITY HEADERS MIDDLEWARE
// ========================

/**
 * Configuration complète des headers de sécurité
 * Protège contre: XSS, Clickjacking, MIME sniffing, etc.
 */
const securityHeaders = helmet({
  // Strict-Transport-Security: Force HTTPS
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // Content-Security-Policy: Prévention XSS et injection de contenu
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'nonce-{NONCE}'", "trusted-scripts.example.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.example.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
    reportUri: "/api/security/csp-report",
  },

  // X-Frame-Options: Protège contre le Clickjacking
  frameguard: {
    action: "deny",
  },

  // X-Content-Type-Options: Prévient MIME sniffing
  noSniff: true,

  // X-XSS-Protection: Complément pour anciens navigateurs
  xssFilter: true,

  // Referrer-Policy: Contrôle les informations de référence
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },

  // Permissions-Policy: Restrict dangerous APIs
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: [],
    payment: [],
  },

  // Expect-CT: Transparence des certificats
  expectCt: {
    maxAge: 86400,
    enforce: true,
    reportUri: "/api/security/expect-ct-report",
  },
});

// ========================
// CSP NONCE GENERATION
// ========================

/**
 * Génère un nonce unique pour chaque requête
 * Utilisé pour les scripts inline et styles inline
 */
const cspNonceMiddleware = (req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("hex");
  res.locals.nonce = nonce;
  res.setHeader(
    "Content-Security-Policy",
    `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' data: https:;
    font-src 'self' fonts.gstatic.com;
    connect-src 'self';
    frame-src 'none';
    object-src 'none';
  `.replace(/\s+/g, " "),
  );
  next();
};

// ========================
// RATE LIMITING
// ========================

/**
 * Limitation de débit global
 * Prévient les attaques DDoS
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite 100 requêtes par windowMs par IP
  message:
    "Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/api/health",
});

/**
 * Limitation stricte pour les endpoints d'authentification
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite 5 tentatives par windowMs
  message:
    "Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.",
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
});

/**
 * Limitation modérée pour les APIs
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limite 30 requêtes par minute
  message: "Trop de requêtes API, veuillez réessayer plus tard.",
});

// ========================
// HPP - HTTP Parameter Pollution Protection
// ========================

const hppMiddleware = hpp({
  whitelist: ["sort", "filter", "search", "page", "limit"],
});

// ========================
// REQUEST SANITIZATION
// ========================

/**
 * Nettoie les entrées utilisateur pour prévenir les injections
 */
const sanitizeRequestMiddleware = (req, res, next) => {
  // Supprime les caractères dangereux des query strings
  Object.keys(req.query).forEach((key) => {
    if (typeof req.query[key] === "string") {
      req.query[key] = sanitizeInput(req.query[key]);
    }
  });

  // Supprime les caractères dangereux du body
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  next();
};

/**
 * Sanitize une chaîne de caractères
 */
function sanitizeInput(input) {
  if (typeof input !== "string") return input;

  // Supprime les balises HTML dangereuses
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

/**
 * Sanitize un objet récursivement
 */
function sanitizeObject(obj) {
  if (typeof obj !== "object" || obj === null) {
    return typeof obj === "string" ? sanitizeInput(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
}

// ========================
// SECURE RESPONSE HEADERS
// ========================

/**
 * Ajoute des headers de sécurité personnalisés
 */
const customSecurityHeaders = (req, res, next) => {
  // Empêche le cache des données sensibles
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Ajoute une signature serveur
  res.setHeader("Server", "GenidocAPI/1.0");

  // Désactive le prefetch dangereux
  res.setHeader("X-DNS-Prefetch-Control", "off");

  // Empêche CORB (Cross-Origin Read Blocking)
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Désactive le MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  next();
};

// ========================
// LOGGING SECURITY EVENTS
// ========================

/**
 * Log les événements de sécurité
 */
const securityEventLogger = (req, res, next) => {
  // Log les tentatives d'accès à des chemins suspects
  const suspiciousPaths = [
    "/admin",
    "/wp-admin",
    "/phpmyadmin",
    "/.env",
    "/config",
  ];
  if (suspiciousPaths.some((path) => req.path.includes(path))) {
    console.warn(
      `[SECURITY] Tentative d'accès suspect: ${req.method} ${req.path} depuis ${req.ip}`,
    );
  }

  // Log les requêtes avec une charge importante
  const contentLength = req.get("content-length") || 0;
  if (contentLength > 10 * 1024 * 1024) {
    // 10MB
    console.warn(
      `[SECURITY] Requête avec charge volumineuse: ${contentLength} bytes depuis ${req.ip}`,
    );
  }

  next();
};

// ========================
// FILE ACCESS PROTECTION
// ========================

/**
 * Bloque l'accès aux fichiers sensibles
 */
const blockSensitiveFiles = (req, res, next) => {
  const blockedFiles = [
    ".env",
    ".git",
    ".env.local",
    ".env.*.local",
    "package.json",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "server.js",
    "server.err.log",
    "server.out.log",
    "capacitor.config.json",
    "mobile-config.js",
    "gradlew",
    "build.gradle",
    "AndroidManifest.xml",
    "Info.plist",
  ];

  const suspiciousPatterns = [
    /\.html$/i,
    /\.sql$/i,
    /\.bak$/i,
    /\.backup$/i,
    /\.tar\.gz$/i,
    /\.zip$/i,
    /\.rar$/i,
    /config.*\.js$/i,
  ];

  const requestPath = req.path.toLowerCase();

  if (
    blockedFiles.includes(requestPath) ||
    blockedFiles.some((f) => requestPath.endsWith("/" + f)) ||
    suspiciousPatterns.some((pattern) => pattern.test(requestPath))
  ) {
    console.warn(
      `[SECURITY] Tentative d'accès à fichier sensible: ${req.path} depuis ${req.ip}`,
    );
    return res.status(403).json({ error: "Accès refusé" });
  }

  next();
};

// ========================
// DISABLE DANGEROUS METHODS
// ========================

/**
 * Désactive les méthodes HTTP dangereuses
 */
const disableDangerousMethods = (req, res, next) => {
  const dangerousMethods = ["TRACE", "CONNECT"];

  if (dangerousMethods.includes(req.method)) {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  next();
};

// ========================
// CSRF PROTECTION TOKEN
// ========================

const crypto_module = require("crypto");

/**
 * Génère un token CSRF
 */
const generateCsrfToken = (req, res, next) => {
  req.csrfToken = () => {
    if (!req.session) req.session = {};
    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto_module.randomBytes(32).toString("hex");
    }
    return req.session.csrfToken;
  };
  next();
};

// ========================
// EXPORT ALL MIDDLEWARE
// ========================

module.exports = {
  securityHeaders,
  cspNonceMiddleware,
  globalLimiter,
  authLimiter,
  apiLimiter,
  hppMiddleware,
  sanitizeRequestMiddleware,
  customSecurityHeaders,
  securityEventLogger,
  blockSensitiveFiles,
  disableDangerousMethods,
  generateCsrfToken,
  sanitizeInput,
  sanitizeObject,
};
