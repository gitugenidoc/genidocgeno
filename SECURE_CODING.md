# 🛡️ SECURE CODING GUIDELINES - Bonnes Pratiques GenidoC

## 📌 Principes Fondamentaux

```
1. NEVER TRUST USER INPUT
   ├─ Toujours valider et nettoyer les données
   ├─ Utiliser les parameterized queries
   └─ Encoder les sorties

2. PRINCIPLE OF LEAST PRIVILEGE
   ├─ Accord minimal de droits
   ├─ Permissions par rôle/fonction
   └─ Révocation régulière

3. DEFENSE IN DEPTH
   ├─ Plusieurs couches de protections
   ├─ Pas de dépendance sur une seule contrôle
   └─ Sécurité en profondeur

4. SECURITY BY DEFAULT
   ├─ Configuration sécurisée par défaut
   ├─ Opt-in pour moins sécurisé
   └─ Explicitement non-sécurisé

5. COMPLETE MEDIATION
   ├─ Vérifier chaque accès
   ├─ Pas de raccourcis ou caches
   └─ Consistent enforcement
```

---

## 🔐 Authentication & Authorization

### ✅ Bonnes Pratiques

```javascript
// ✅ BON: Validation stricte
const { checkPermission } = require("../middleware/auth");

router.get("/students", checkPermission("students:read"), (req, res) => {
  // L'utilisateur a la permission
  Student.findAll();
});

// ✅ BON: Hash des mots de passe
const bcrypt = require("bcryptjs");

const hashedPassword = await bcrypt.hash(password, 12);
// Stocker hashedPassword, JAMAIS le plaintext

// ✅ BON: JWT sécurisé
const jwt = require("jsonwebtoken");
const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
  expiresIn: "24h",
  algorithm: "HS256",
});

// ✅ BON: Verifier le JWT
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// ✅ BON: Vérifier l'expiration
if (Date.now() >= decoded.exp * 1000) {
  throw new Error("Token expiré");
}
```

### ❌ Mauvaises Pratiques

```javascript
// ❌ MAUVAIS: Mots de passe en plaintext
user.password = password; // JAMAIS!

// ❌ MAUVAIS: JWT sans expiration
jwt.sign({ userId }, secret); // Pas d'expiresIn!

// ❌ MAUVAIS: Secret faible
const JWT_SECRET = "password123"; // Trop court!

// ❌ MAUVAIS: Permission par défaut
if (!hasPermission) {
  // Pas de vérification = accès par défaut!
}
```

---

## 🎯 Input Validation

### ✅ Bonnes Pratiques

```javascript
// ✅ BON: Valider avec express-validator
const { body, validationResult } = require("express-validator");

router.post(
  "/students",
  [
    body("firstName")
      .trim()
      .notEmpty()
      .isLength({ min: 2, max: 100 })
      .matches(/^[a-zA-Z\s'-]+$/),

    body("email").isEmail().normalizeEmail(),

    body("age").isInt({ min: 0, max: 150 }),

    body("phone").optional().isMobilePhone("fr-FR"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Données validées
    const { firstName, email, age } = req.body;
  },
);

// ✅ BON: Whitelist les champs
const allowedFields = ["firstName", "email", "age", "phone"];
const sanitized = {};

Object.keys(req.body).forEach((key) => {
  if (allowedFields.includes(key)) {
    sanitized[key] = req.body[key];
  }
});

// ✅ BON: Limiter la taille des données
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "10kb" }));

// ✅ BON: Vérifier les types
if (typeof req.body.age !== "number") {
  throw new Error("Age doit être un nombre");
}
```

### ❌ Mauvaises Pratiques

```javascript
// ❌ MAUVAIS: Pas de validation
router.post("/students", (req, res) => {
  db.query(`INSERT INTO students VALUES ('${req.body.firstName}')`);
});

// ❌ MAUVAIS: Accepter tous les champs
Object.assign(user, req.body); // Injection de champs!

// ❌ MAUVAIS: Pas de limite de taille
app.use(express.json()); // Illimité = DoS

// ❌ MAUVAIS: Pas d'échappement
res.json(req.body); // Peut contenir du code malveillant
```

---

## 🗄️ Database Security

### ✅ Bonnes Pratiques

```javascript
// ✅ BON: Parameterized Queries
const { db } = require("../config/database");

const student = await db.query("SELECT * FROM students WHERE id = $1", [id]);

// ✅ BON: Prepared Statements
const stmt = db.prepare("INSERT INTO students (name, email) VALUES (?, ?)");
stmt.run([name, email]);

// ✅ BON: Connection pooling
const pool = new pg.Pool({
  min: 2,
  max: 10,
});

// ✅ BON: Chiffrement sensible
const crypto = require("crypto");
const encrypted = crypto.createCipher("aes-256-cbc", key).update(data);

// ✅ BON: Audit logging
await db.query(
  `INSERT INTO audit_log (user_id, action, timestamp) VALUES ($1, $2, $3)`,
  [userId, "UPDATE_STUDENT", new Date()],
);

// ✅ BON: Transactions
await db.query("BEGIN");
try {
  await db.query("UPDATE students SET status = $1", ["active"]);
  await db.query("INSERT INTO logs (action) VALUES ($1)", ["status_updated"]);
  await db.query("COMMIT");
} catch (error) {
  await db.query("ROLLBACK");
}
```

### ❌ Mauvaises Pratiques

```javascript
// ❌ MAUVAIS: SQL Injection
db.query(`SELECT * FROM students WHERE id = ${id}`);

// ❌ MAUVAIS: String concatenation
const query = 'SELECT * FROM students WHERE email = "' + email + '"';

// ❌ MAUVAIS: Pas de chiffrement
userdata.creditCard = creditCard; // Plaintext!

// ❌ MAUVAIS: Pas d'audit
db.query("DELETE FROM students WHERE id = $1", [id]); // Pas de log!
```

---

## 🌐 API Security

### ✅ Bonnes Pratiques

```javascript
// ✅ BON: CORS restrictif
app.use(
  cors({
    origin: ["https://app.genidoc.local"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

// ✅ BON: Rate limiting par endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

router.post("/auth/login", loginLimiter, (req, res) => {
  // Max 5 tentatives par 15 minutes
});

// ✅ BON: Vérifier Content-Type
router.post("/api/data", (req, res) => {
  if (req.get("content-type") !== "application/json") {
    return res.status(415).json({ error: "Unsupported Media Type" });
  }
});

// ✅ BON: API versioning
app.use("/api/v1", require("./routes/v1"));
app.use("/api/v2", require("./routes/v2"));

// ✅ BON: Webhook signing
const signature = crypto
  .createHmac("sha256", secret)
  .update(body)
  .digest("hex");

if (signature !== req.get("X-Signature")) {
  return res.status(401).json({ error: "Invalid signature" });
}
```

### ❌ Mauvaises Pratiques

```javascript
// ❌ MAUVAIS: CORS ouvert
app.use(cors({ origin: "*" })); // Accepte tout!

// ❌ MAUVAIS: Pas de rate limiting
// Attaque DDoS facile

// ❌ MAUVAIS: Pas de Content-Type check
// Accepte n'importe quoi

// ❌ MAUVAIS: Pas de versioning
// Casser les clients existants!
```

---

## 🔐 Error Handling

### ✅ Bonnes Pratiques

```javascript
// ✅ BON: Gestion d'erreur centralisée
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== "production";

  console.error("[ERROR]", {
    message: err.message,
    stack: isDev ? err.stack : undefined,
    path: req.path,
    timestamp: new Date(),
  });

  const response = {
    error: isDev ? err.message : "Erreur serveur interne",
    status: err.statusCode || 500,
    timestamp: new Date(),
  };

  res.status(err.statusCode || 500).json(response);
});

// ✅ BON: Messages d'erreur génériques en production
throw new Error({
  statusCode: 400,
  message: "Données invalides", // Pas de détails!
});

// ✅ BON: Logging des erreurs sensibles
try {
  // ...
} catch (error) {
  logger.error("Database connection failed", {
    error: error.message,
    code: error.code,
    timestamp: new Date(),
  });

  res.status(500).json({ error: "Service indisponible" });
}
```

### ❌ Mauvaises Pratiques

```javascript
// ❌ MAUVAIS: Exposer la stack trace
res.json({ error: err.stack }); // Info de sécurité!

// ❌ MAUVAIS: Détails excessifs
res.json({
  error: "User not found with email test@example.com",
  // Révèle existences d'utilisateurs!
});

// ❌ MAUVAIS: Pas de logging
if (error) throw error;

// ❌ MAUVAIS: Server info exposé
res.set("Server", "Apache/2.4.1"); // Info du serveur!
```

---

## 📝 Logging & Monitoring

### ✅ Bonnes Pratiques

```javascript
// ✅ BON: Logging structuré
const logger = require("./utils/logger");

logger.info("User login", {
  userId: user.id,
  email: user.email,
  timestamp: new Date(),
  ip: req.ip,
});

// ✅ BON: Logging d'erreurs de sécurité
logger.warn("SECURITY", {
  event: "failed_auth",
  attempts: failedAttempts,
  ip: req.ip,
  timestamp: new Date(),
});

// ✅ BON: Audit trail
auditLog.record({
  userId: req.user.id,
  action: "DELETE_STUDENT",
  resource: studentId,
  changes: {
    before: oldData,
    after: newData,
  },
  timestamp: new Date(),
});

// ✅ BON: Monitoring des seuils
if (errorRate > 0.05) {
  // Plus de 5% erreurs
  alert("High error rate detected");
}
```

### ❌ Mauvaises Pratiques

```javascript
// ❌ MAUVAIS: Pas de logging
// Impossible de debugger les incidents!

// ❌ MAUVAIS: Logging du plaintext password
logger.info("User logged in", { password: user.password });

// ❌ MAUVAIS: Logging des données sensibles
logger.info("Payment", {
  creditCard: "4111-1111-1111-1111",
  cvv: "123",
});

// ❌ MAUVAIS: Pas de monitoring
// Incidents non détectés!
```

---

## 🔄 Secure Update & Deployment

### ✅ Bonnes Pratiques

```bash
# ✅ BON: Audit des dépendances
npm audit
npm audit fix

# ✅ BON: Test avant déploiement
npm run test
npm run test:security

# ✅ BON: Versioning
git tag -a v1.0.0 -m "Security update"

# ✅ BON: Changelog
# CHANGELOG.md: "- Fixed XSS vulnerability in search"

# ✅ BON: Blue-Green deployment
# Old version running ✅
# New version deployed ✓
# Switch traffic when ready
# Keep old version as rollback
```

### ❌ Mauvaises Pratiques

```bash
# ❌ MAUVAIS: Pas d'audit
npm install <package>  # Quelle version? Sûre?

# ❌ MAUVAIS: Déployer sans tester
git push && npm start

# ❌ MAUVAIS: Pas de versioning
# Comment savoir quelle version est en prod?

# ❌ MAUVAIS: Pas de rollback plan
# Le déploiement échoue = perte de service!
```

---

## 📋 Code Review Checklist

Avant de merger:

```
[ ] Pas de secrets en code (API keys, passwords)
[ ] Input validé et sanitizé
[ ] Authentification requise
[ ] Autorisation vérifiée
[ ] Parameterized queries (pas de SQL injection)
[ ] Error messages génériques
[ ] Logging d'événements importants
[ ] Tests unitaires passent
[ ] Tests de sécurité passent
[ ] Pas de `eval()` ou `Function()`
[ ] Pas de `TODO: FIX SECURITY`
[ ] Dépendances à jour (npm audit)
[ ] Documentation de sécurité
[ ] Pas de commandes shell dangereuses
```

---

## 🧪 Testing de Sécurité

### Unit Tests

```javascript
const assert = require("assert");
const { validateEmail } = require("../validators");

describe("Email Validation", () => {
  it("should reject XSS payload", () => {
    const result = validateEmail("<script>alert(1)</script>");
    assert(result === false);
  });

  it("should reject SQL injection", () => {
    const result = validateEmail("'; DROP TABLE users; --");
    assert(result === false);
  });

  it("should accept valid email", () => {
    const result = validateEmail("user@example.com");
    assert(result === true);
  });
});
```

### Integration Tests

```bash
# Test authentification
npm run test:auth

# Test autorisation
npm run test:rbac

# Test sécurité API
npm run test:security

# Scan vulnérabilités
npm audit --audit-level=moderate
```

---

## 📚 Ressources

- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [CWE Top 25](https://cwe.mitre.org/top25/)

---

**Dernière mise à jour:** 2026-05-20
**Version:** 1.0.0
**Mainteneur:** Équipe de sécurité GenidoC
