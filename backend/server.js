const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const db = require("./config/database");

// ========================
// IMPORT SECURITY MIDDLEWARE
// ========================
const {
  securityHeaders,
  cspNonceMiddleware,
  globalLimiter,
  apiLimiter,
  authLimiter,
  hppMiddleware,
  sanitizeRequestMiddleware,
  customSecurityHeaders,
  securityEventLogger,
  blockSensitiveFiles,
  disableDangerousMethods,
} = require("./middleware/security");

const {
  registerHtmlRoutes,
  blockDirectHtmlAccess,
} = require("./middleware/htmlRoutes");

const app = express();
const startedAt = new Date();

// ========================
// GLOBAL SECURITY MIDDLEWARE - ORDER MATTERS!
// ========================

// 1. Désactive les méthodes HTTP dangereuses
app.use(disableDangerousMethods);

// 2. Bloque les fichiers sensibles
app.use(blockSensitiveFiles);

// 3. Trust proxy for rate limiting and https redirect
app.set("trust proxy", 1);

// 4. Helmet - Headers de sécurité
app.use(securityHeaders);

// 5. CSP Nonce Middleware
app.use(cspNonceMiddleware);

// 6. CORS Configuration
const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  process.env.FRONTEND_URL ||
  ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        process.env.NODE_ENV !== "production" ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
      console.warn(`[SECURITY] CORS rejection for origin: ${origin}`);
      return callback(new Error("Origine CORS non autorisee"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    maxAge: 86400,
  }),
);

// 7. HTTP Redirect pour HTTPS en production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    if (
      req.headers["x-forwarded-proto"] &&
      req.headers["x-forwarded-proto"] !== "https"
    ) {
      console.warn(
        `[SECURITY] HTTP request redirected to HTTPS from ${req.ip}`,
      );
      return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    }
  }
  next();
});

// 8. Custom Security Headers
app.use(customSecurityHeaders);

// 9. Security Event Logger
app.use(securityEventLogger);

// 10. Global Rate Limiting (AVANT de parser les données)
app.use(globalLimiter);

// 11. Parse JSON avec limite de taille
app.use(express.json({ limit: "10kb" })); // Limite 10KB pour prévenir les attaques DoS
app.use(express.urlencoded({ limit: "10kb", extended: false }));

// 12. HPP - HTTP Parameter Pollution Protection
app.use(hppMiddleware);

// 13. Sanitize les requêtes
app.use(sanitizeRequestMiddleware);

// ========================
// STATIC FILES - SÉCURISÉS
// ========================

// Seulement les assets publics
app.use(
  express.static(path.join(__dirname, "..", "mobile-www"), {
    dotfiles: "ignore",
    maxAge: "1h",
    etag: true,
  }),
);

// ========================
// API ROUTES - AVEC RATE LIMITING
// ========================

// Routes d'authentification - Rate limit strict
app.use("/api/auth", authLimiter, require("./routes/auth"));

// Routes API - Rate limit modéré
app.use("/api/public", apiLimiter, require("./routes/public"));
app.use("/api/invitations", apiLimiter, require("./routes/invitations"));
app.use("/api/schools", apiLimiter, require("./routes/schools"));
app.use("/api/students", apiLimiter, require("./routes/students"));
app.use("/api/parent", apiLimiter, require("./routes/parent"));
app.use("/api/documents", apiLimiter, require("./routes/documents"));
app.use("/api/emergency", apiLimiter, require("./routes/emergency"));
app.use("/api/incidents", apiLimiter, require("./routes/incidents"));
app.use("/api/audit", apiLimiter, require("./routes/audit"));
app.use("/api/patients", apiLimiter, require("./routes/patients"));
app.use("/api/appointments", apiLimiter, require("./routes/appointments"));
app.use(
  "/api/medical-records",
  apiLimiter,
  require("./routes/medical-records"),
);
app.use("/api/doctors", apiLimiter, require("./routes/doctors"));

// ========================
// SECURITY ENDPOINTS
// ========================

/**
 * Endpoint pour recevoir les rapports CSP violations
 * Utilisé pour détecter les tentatives XSS
 */
app.post("/api/security/csp-report", (req, res) => {
  const violation = req.body["csp-report"];
  if (violation) {
    console.warn("[SECURITY] CSP VIOLATION:", {
      blockedUri: violation["blocked-uri"],
      violatedDirective: violation["violated-directive"],
      originalPolicy: violation["original-policy"],
      sourceFile: violation["source-file"],
      lineNumber: violation["line-number"],
      columnNumber: violation["column-number"],
      statusCode: violation["status-code"],
      documentUri: violation["document-uri"],
      timestamp: new Date().toISOString(),
      ip: req.ip,
    });
  }
  res.status(204).send();
});

/**
 * Endpoint pour recevoir les rapports Expect-CT
 * Utilisé pour valider les certificats
 */
app.post("/api/security/expect-ct-report", (req, res) => {
  console.warn("[SECURITY] EXPECT-CT REPORT:", {
    report: req.body,
    timestamp: new Date().toISOString(),
    ip: req.ip,
  });
  res.status(204).send();
});

// ========================
// HEALTH CHECK ENDPOINTS
// ========================

/**
 * Health check - Pas de rate limiting
 */
app.get("/api/health", (req, res) => {
  // Ne expose pas les informations sensibles
  res.json({
    status: "OK",
    service: "genidoc-hayat-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness check - Vérifie la base de données
 */
app.get("/api/ready", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({
      status: "ready",
      database: "OK",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[ERROR] Readiness check failed:", error);
    res.status(503).json({
      status: "not_ready",
      database: "ERROR",
      timestamp: new Date().toISOString(),
    });
  }
});

// ========================
// INFORMATION DISCLOSURE PREVENTION
// ========================

// Empêche l'exposition du serveur
app.disable("x-powered-by");

// Custom 404 pour éviter les informations de serveur
app.use((req, res, next) => {
  // Enregistre les requêtes suspectes
  if (req.path.match(/^\/(admin|wp-admin|phpmyadmin|\.env|config)/i)) {
    console.warn(
      `[SECURITY] Suspicious request: ${req.method} ${req.path} from ${req.ip}`,
    );
  }

  // Retourne une erreur générique
  res.status(404).json({
    error: "Not found",
    timestamp: new Date().toISOString(),
  });
});

// ========================
// ERROR HANDLING
// ========================

/**
 * Gestionnaire d'erreurs centralisé
 * Ne expose jamais les détails d'erreur en production
 */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV !== "production";

  console.error(`[ERROR] ${statusCode}:`, {
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // En production, ne retourne jamais les détails d'erreur
  const response = {
    error: isDevelopment ? err.message : "Erreur serveur interne",
    timestamp: new Date().toISOString(),
  };

  if (isDevelopment) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

// ========================
// HTML ROUTES - MUST BE LAST!
// ========================

// Enregistre les routes HTML dynamiques
registerHtmlRoutes(app);

// ========================
// START SERVER
// ========================

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ GeniDoc API démarrée sur port ${PORT}`);
  console.log(`🔒 Sécurité activée`);
  console.log(
    `   - HTTPS enforcement: ${process.env.NODE_ENV === "production" ? "ON" : "OFF"}`,
  );
  console.log(`   - Rate limiting: ON`);
  console.log(`   - CSP Policy: ENABLED`);
  console.log(`   - CORS: RESTRICTED`);
  console.log(`   - File access blocking: ON`);
  console.log(`${"=".repeat(60)}\n`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[SHUTDOWN] Arrêt gracieux du serveur...");
  server.close(() => {
    console.log("[SHUTDOWN] Serveur arrêté");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("[SHUTDOWN] Arrêt demandé par utilisateur");
  server.close(() => {
    console.log("[SHUTDOWN] Serveur arrêté");
    process.exit(0);
  });
});

module.exports = app;
