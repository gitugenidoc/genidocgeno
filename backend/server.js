const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const db = require("./config/database");

const app = express();
const startedAt = new Date();

// Middleware
app.set("trust proxy", 1);
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || process.env.NODE_ENV !== "production" || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origine CORS non autorisee"));
    },
    credentials: true,
  }),
);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    if (req.headers["x-forwarded-proto"] && req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    }
  }
  next();
});
app.use(express.json());
app.use((req, res, next) => {
  const blockedStaticRoots = ["/backend", "/db", "/storage", "/docs"];
  const blockedStaticFiles = [
    "/package.json",
    "/package-lock.json",
    "/server.err.log",
    "/server.out.log",
    "/server.detached.err.log",
    "/server.detached.out.log",
  ];
  if (
    blockedStaticRoots.some((root) => req.path === root || req.path.startsWith(`${root}/`)) ||
    blockedStaticFiles.includes(req.path)
  ) {
    return res.status(404).send("Not found");
  }
  next();
});
app.use(express.static(path.join(__dirname, ".."), { dotfiles: "ignore" }));

// Routes
app.use("/api/public", require("./routes/public"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/invitations", require("./routes/invitations"));
app.use("/api/schools", require("./routes/schools"));
app.use("/api/students", require("./routes/students"));
app.use("/api/parent", require("./routes/parent"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/emergency", require("./routes/emergency"));
app.use("/api/incidents", require("./routes/incidents"));
app.use("/api/audit", require("./routes/audit"));
app.use("/api/patients", require("./routes/patients"));
app.use("/api/appointments", require("./routes/appointments"));
app.use("/api/medical-records", require("./routes/medical-records"));
app.use("/api/doctors", require("./routes/doctors"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "genidoc-hayat-api",
    uptime_seconds: Math.floor(process.uptime()),
    started_at: startedAt.toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/ready", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ready", database: "OK" });
  } catch (error) {
    res.status(503).json({ status: "not_ready", database: "ERROR" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ GeniDoc API démarrée sur port ${PORT}`);
});

module.exports = app;
