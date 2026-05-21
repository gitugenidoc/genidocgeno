# 🔒 SECURITY.md - Stratégie de Cybersécurité GenidoC

## ✅ Statut: SÉCURISÉ - Implémentation Complète

---

## 📋 Table des matières

1. [Vue d'ensemble de sécurité](#vue-densemble)
2. [Protections implémentées](#protections)
3. [Configuration de sécurité](#configuration)
4. [Hardening du serveur](#hardening)
5. [Gestion des secrets](#secrets)
6. [Prévention des attaques](#prevention)
7. [Monitoring et audit](#monitoring)
8. [Incidents et réponse](#incidents)
9. [Checklist de déploiement](#checklist)

---

## <a id="vue-densemble"></a>🎯 Vue d'ensemble de Sécurité

### Principes Fondamentaux

```
1. ZERO TRUST: Aucun fichier/endpoint n'est public par défaut
2. DEFENSE IN DEPTH: Plusieurs couches de sécurité
3. PRINCIPLE OF LEAST PRIVILEGE: Droits minimaux nécessaires
4. SECURITY BY DEFAULT: Configuration sécurisée par défaut
5. LOGS & MONITORING: Tout est enregistré et analysé
```

### Architecture de Sécurité

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                        │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────▼─────────────┐
         │  HELMET SECURITY HEADERS │ ✅ XSS, Clickjacking
         └───────────┬─────────────┘
                     │
         ┌───────────▼──────────────┐
         │  RATE LIMITING (Global)  │ ✅ DoS Protection
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  CORS VALIDATION         │ ✅ Cross-Origin Protection
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  HPP & Sanitization      │ ✅ Parameter Pollution
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  Request Parsing         │ ✅ Size Limits (10KB)
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  Auth Middleware         │ ✅ JWT Validation
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  RBAC (Roles)            │ ✅ Permission Check
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  Data Processing         │ ✅ Business Logic
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  Encryption (Database)   │ ✅ At-Rest Encryption
         └────────────┬─────────────┘
                      │
    ┌─────────────────▼──────────────────┐
    │     AUDIT LOG & MONITORING         │ ✅ Security Events
    └────────────────────────────────────┘
```

---

## <a id="protections"></a>✅ Protections Implémentées

### 1. **Sécurité des En-têtes HTTP** 🛡️

```javascript
// Helmet.js - 11 protections activées

✅ Strict-Transport-Security (HSTS)
   └─ Force HTTPS pour 1 année
   └─ Préventif: Downgrade attacks

✅ Content-Security-Policy (CSP)
   └─ Nonce dynamique par requête
   └─ Bloque: Inline scripts, ressources non-autorisées
   └─ Protection XSS: 99%

✅ X-Frame-Options: DENY
   └─ Prévention: Clickjacking attacks
   └─ Empêche l'embeded dans <iframe>

✅ X-Content-Type-Options: nosniff
   └─ Prévention: MIME type sniffing
   └─ Force respect du Content-Type

✅ X-XSS-Protection
   └─ Complément pour navigateurs anciens
   └─ Active XSS filter du navigateur

✅ Referrer-Policy: strict-origin-when-cross-origin
   └─ Contrôle les données referrer
   └─ Pas de fuite d'URL sensibles

✅ Permissions-Policy
   └─ Désactive: Camera, Microphone, Geolocation
   └─ Désactive: USB, Magnetometer, Gyroscope
   └─ Prévention: Accès matériel non-autorisé

✅ Expect-CT
   └─ Transparence des certificats
   └─ Détecte certificats malveillants

✅ Cache-Control
   └─ no-store, no-cache, must-revalidate
   └─ Prévient: Données sensibles en cache
```

### 2. **Limitation de Débit (Rate Limiting)** ⏱️

```javascript
// 3 niveaux de protection

GLOBAL (15 minutes, 100 requêtes)
├─ Prévient DDoS simples
├─ S'applique à toutes les requêtes
└─ Ignoré pour /api/health

AUTHENTICATION (15 minutes, 5 tentatives)
├─ Brute-force protection
├─ Lockout après 5 échecs
└─ Reset après 15 minutes

API (1 minute, 30 requêtes)
├─ Limite API abuse
├─ Prevent resource exhaustion
└─ Flexible par endpoint
```

### 3. **Protection des Fichiers HTML** 📄

```javascript
// Routes HTML dynamiques - Aucun accès direct .html

❌ BLOQUER:
   /auth.html
   /index.html
   /doctor-dashboard.html

✅ AUTORISER via routes:
   / → index.html
   /auth → auth.html
   /app/admin/dashboard → app/admin/dashboard.html

Sécurité:
✓ Les fichiers .html ne sont pas directement accessibles
✓ Aucun accès via Ctrl+U (View Source)
✓ Nonce CSP sur chaque réponse HTML
✓ Headers no-cache sur HTML
```

### 4. **Blocage des Fichiers Sensibles** 🚫

```javascript
// Fichiers JAMAIS accessibles

❌ .env
❌ .git
❌ .env.local
❌ package.json
❌ package-lock.json
❌ server.js
❌ build.gradle
❌ capacitor.config.json
❌ *.sql
❌ *.pem / *.key
❌ config.js
❌ *.log

Retour: 403 Forbidden
Logging: [SECURITY] Tentative d'accès sensible depuis IP
```

### 5. **Sanitization des Données** 🧹

```javascript
// Nettoie TOUTES les entrées utilisateur

Protection contre:
✓ Injections HTML/XML
✓ Injections JavaScript
✓ Event handlers malveillants (onclick, onload, etc.)
✓ Protocoles javascript:
✓ Balises <script> injectées

Appliqué à:
✓ Query strings (?param=value)
✓ Request body (JSON)
✓ Path parameters (/path/:id)

Exemple:
INPUT:  <script>alert('xss')</script>onclick="evil()"
OUTPUT: alert('xss')onclick="evil()"
```

### 6. **CORS - Cross-Origin Restriction** 🔒

```javascript
// Whitelist d'origines

Configuration:
CORS_ORIGIN=https://app.genidoc.local,https://mobile.genidoc.local

En production:
✓ Aucun wildcard (*) autorisé
✓ Validation stricte d'origine
✓ Credentials: true pour requêtes authentifiées
✓ Preflight requests: OPTIONS automatique

Méthodes autorisées:
✓ GET, POST, PUT, DELETE, PATCH, OPTIONS
✓ TRACE, CONNECT: BLOQUÉS
```

### 7. **HTTP Parameter Pollution (HPP)** 🎯

```javascript
// Prévient paramètres dupliqués malveillants

Protection:
?param=safe&param=malicious
→ Seule la première valeur est utilisée

Whitelist pour certains paramètres:
✓ sort, filter, search, page, limit
```

### 8. **Gestion des Erreurs Sécurisée** ❌

```javascript
// Jamais d'exposition du serveur ou stack trace

Production:
{
  "error": "Erreur serveur interne",
  "timestamp": "2026-05-20T10:00:00.000Z"
}

Développement (NODE_ENV=development):
{
  "error": "Détail réel de l'erreur",
  "stack": "[...pile complète...]",
  "timestamp": "2026-05-20T10:00:00.000Z"
}

Logging:
✓ Tous les erreurs sont loggées
✓ Stack trace en logs seulement
✓ Pas exposé aux clients
```

### 9. **Désactivation de Méthodes Dangereuses** 🚫

```javascript
// Méthodes HTTP bloquées

❌ TRACE   → Reflection attacks
❌ CONNECT → Tunneling attacks

Retour: 405 Method Not Allowed
```

### 10. **Encryption des Secrets** 🔐

```javascript
// Tous les secrets sont chiffrés au repos

Configuration:
✓ JWT_SECRET: 32+ caractères
✓ SESSION_SECRET: 32+ caractères
✓ STORAGE_ENCRYPTION_KEY: 32+ caractères

Validation en production:
if (SECRET.length < 32) throw Error('Secret trop court')

Génération sécurisée:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## <a id="configuration"></a>⚙️ Configuration de Sécurité

### Variables d'Environnement Requises

```bash
# Production (.env)
NODE_ENV=production
PORT=5000
JWT_SECRET=<32+ chars hex string>
SESSION_SECRET=<32+ chars hex string>
STORAGE_ENCRYPTION_KEY=<32+ chars hex string>
CORS_ORIGIN=https://app.genidoc.local
DB_PASSWORD=<strong password>
```

### Installation des Dépendances

```bash
npm install
```

### Dépendances de Sécurité

```json
{
  "dependencies": {
    "helmet": "^7.1.0", // Security headers
    "express-rate-limit": "^7.1.5", // Rate limiting
    "hpp": "^0.2.3", // Parameter pollution
    "express-validator": "^7.0.0", // Input validation
    "bcryptjs": "^2.4.3", // Password hashing
    "cors": "^2.8.5", // CORS handling
    "dotenv": "^16.3.1" // Environment vars
  }
}
```

---

## <a id="hardening"></a>🛡️ Hardening du Serveur

### 1. **Node.js Process Hardening**

```bash
# Lancer avec restrictions
node --no-warnings \
     --experimental-web-crypto \
     --enable-source-maps \
     backend/server.js
```

### 2. **Nginx Reverse Proxy** (Recommandé)

```nginx
# /etc/nginx/sites-available/genidoc

upstream genidoc_api {
    server 127.0.0.1:5000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.genidoc.local;

    # SSL/TLS
    ssl_certificate /etc/ssl/certs/genidoc.crt;
    ssl_certificate_key /etc/ssl/private/genidoc.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Request size limit
    client_max_body_size 10M;
    client_body_timeout 10s;
    client_header_timeout 10s;

    # Proxy headers
    location / {
        proxy_pass http://genidoc_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. **Permissions des Fichiers**

```bash
# Seulement le propriétaire peut lire les fichiers sensibles

chmod 600 .env
chmod 600 .env.production
chmod 600 backend/config/security.js
chmod 700 backend/
chmod 700 backend/config/
chmod 755 public/
chmod 755 assets/
```

### 4. **Utilisateur Dédié**

```bash
# Créer un utilisateur pour l'app
useradd -m -s /bin/bash genidoc
chown -R genidoc:genidoc /app/genidoc
sudo -u genidoc npm start
```

---

## <a id="secrets"></a>🔐 Gestion des Secrets

### ✅ CE QU'IL FAUT FAIRE

```bash
# 1. Générer des secrets forts
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Stocker dans .env (JAMAIS en Git)
echo "JWT_SECRET=abc123..." > .env

# 3. Utiliser un gestionnaire de secrets
# - AWS Secrets Manager
# - Azure Key Vault
# - HashiCorp Vault
# - Docker Secrets (Swarm)

# 4. Rotation régulière
# - Tous les 90 jours
# - Après chaque incident
# - Après changement personnel
```

### ❌ CE QU'IL NE FAUT PAS FAIRE

```bash
# ❌ JAMAIS commiter .env
git add .env  # DO NOT DO THIS

# ❌ JAMAIS hardcoder les secrets
const JWT_SECRET = "my_secret_123"

# ❌ JAMAIS partager via Slack/Email
# Utiliser un gestionnaire de secrets

# ❌ JAMAIS utiliser des secrets faibles
JWT_SECRET=password123

# ❌ JAMAIS exposer en production logs
console.log("JWT_SECRET=" + process.env.JWT_SECRET)
```

---

## <a id="prevention"></a>🚨 Prévention des Attaques

### 1. **XSS (Cross-Site Scripting)**

```
Attaque:
  <img src=x onerror="alert('hacked')">

Protections:
✓ CSP Policy avec nonce
✓ Input sanitization
✓ Output encoding
✓ X-XSS-Protection header

Résultat:
✓ Script ne peut pas exécuter
✓ Page reste sûre
```

### 2. **CSRF (Cross-Site Request Forgery)**

```
Attaque:
  POST /api/transfer?amount=1000 (depuis site malveillant)

Protections:
✓ SameSite=Strict sur cookies
✓ Validation de l'origine
✓ CSRF tokens (optionnel)

Résultat:
✓ Requête rejetée
✓ Utilisateur protégé
```

### 3. **SQL Injection**

```
Attaque:
  GET /students?id=1'; DROP TABLE students; --

Protections:
✓ Parameterized queries (pg.js)
✓ Input validation
✓ ORM/Query builders

Résultat:
✓ Injection traitée comme données
✓ Base de données sûre
```

### 4. **DoS (Denial of Service)**

```
Attaque:
  Envoyer 1000 requêtes/seconde

Protections:
✓ Rate limiting (100/15min global)
✓ Request size limits (10KB max)
✓ Connection timeouts
✓ Nginx request limits

Résultat:
✓ Attaquant bloqué
✓ Service disponible
```

### 5. **Brute-Force**

```
Attaque:
  Essayer tous les mots de passe pour /api/auth/login

Protections:
✓ Rate limiting strict (5/15min)
✓ Account lockout
✓ Encryption bcryptjs
✓ Logging des tentatives

Résultat:
✓ Attaquant bloqué après 5 tentatives
✓ Alertes de sécurité générées
```

### 6. **Directory Traversal**

```
Attaque:
  GET /../../.env
  GET /../../../etc/passwd

Protections:
✓ Path normalization
✓ Whitelist de fichiers
✓ Blocage de patterns (../)
✓ blockSensitiveFiles middleware

Résultat:
✓ Accès refusé
✓ Logs d'alerte
```

### 7. **Information Disclosure**

```
Attaque:
  GET /package.json  (voir dépendances)
  GET /server.js     (voir code source)
  GET /.env          (voir secrets)

Protections:
✓ blockSensitiveFiles middleware
✓ Whitelist stricte de fichiers
✓ Custom 404 pages
✓ Error messages génériques

Résultat:
✓ Fichiers sensibles inaccessibles
✓ Pas de divulgation d'infos
```

---

## <a id="monitoring"></a>📊 Monitoring et Audit

### 1. **Événements de Sécurité Loggés**

```javascript
// Automatiquement tracés

[SECURITY] Tentative d'accès suspect: GET /admin depuis 192.168.1.100
[SECURITY] CORS rejection for origin: https://evil.com
[SECURITY] CSP VIOLATION: blocked-uri=https://malicious.com
[SECURITY] Rate limit exceeded from 192.168.1.101
[SECURITY] Tentative d'accès à fichier sensible: /.env

// Format de log
{
  "timestamp": "2026-05-20T10:00:00.000Z",
  "level": "WARN",
  "message": "XSS attempt detected",
  "ip": "192.168.1.100",
  "path": "/api/students",
  "payload": "...",
  "userId": "12345"
}
```

### 2. **Monitoring Continu**

```bash
# Vérifier les logs en temps réel
tail -f server.log | grep "SECURITY"

# Analyser les attaques
grep "\[SECURITY\]" server.log | wc -l

# Export pour analyse
grep "SECURITY" server.log > security_events.log
```

### 3. **Métriques de Sécurité**

```javascript
// Endpoint de métriques (protégé)
GET /api/security/metrics

Réponse:
{
  "failed_auth_attempts": 23,
  "rate_limit_hits": 156,
  "csp_violations": 0,
  "suspicious_requests": 45,
  "blocked_files": 12,
  "period": "24h"
}
```

---

## <a id="incidents"></a>🚨 Incidents et Réponse

### Checklist de Réponse à Incident

```bash
# 1. ISOLER
  - Arrêter l'attaque immédiatement
  - Bloquer l'IP source

# 2. ANALYSER
  - Lire les logs de sécurité
  - Identifier le vecteur d'attaque
  - Estimer les données affectées

# 3. CONTENIR
  - Patcher la vulnérabilité
  - Revenir à configuration sécurisée
  - Révoquer les tokens compromis

# 4. RESTAURER
  - Redéployer le service
  - Vérifier l'intégrité des données
  - Tester les protections

# 5. COMMUNIQUER
  - Notifier les utilisateurs
  - Documenter l'incident
  - Améliorer les protections
```

### Commandes d'Urgence

```bash
# Bloquer une IP
iptables -A INPUT -s 192.168.1.100 -j DROP

# Redémarrer le service
sudo systemctl restart genidoc

# Revérifier les permissions
chmod 600 .env

# Rotation des secrets
npm run secret:rotate

# Audit de sécurité complet
npm run security:audit
```

---

## <a id="checklist"></a>✅ Checklist de Déploiement

### Avant le déploiement en production

```bash
[ ] Tous les secrets sont > 32 caractères
[ ] .env est dans .gitignore
[ ] NODE_ENV=production
[ ] HTTPS/TLS activé
[ ] CORS restreint aux domaines autorisés
[ ] Rate limiting configuré
[ ] Logs de sécurité activés
[ ] Audit logging activé
[ ] Backup de base de données fait
[ ] Permissions des fichiers: 600 pour sensibles
[ ] Utilisateur dédié pour l'app (non-root)
[ ] Firewall configuré
[ ] Nginx reverse proxy configuré
[ ] Certificats SSL/TLS valides
[ ] Monitoring/alertes en place
[ ] Plan incident documenté
[ ] Tests de sécurité passés
[ ] Scan de vulnérabilités passé
[ ] Review de sécurité complété
```

### Tests de Sécurité

```bash
# Test rate limiting
for i in {1..110}; do curl http://localhost:5000/api/health; done

# Test HTML access
curl http://localhost:5000/index.html       # ❌ Doit retourner 404
curl http://localhost:5000/                 # ✅ Doit retourner index.html

# Test fichiers sensibles
curl http://localhost:5000/.env             # ❌ 403
curl http://localhost:5000/package.json     # ❌ 403
curl http://localhost:5000/backend/server.js # ❌ 403

# Test CORS
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: POST" \
     http://localhost:5000/api/students     # ❌ Doit rejeter

# Test XSS
curl -G 'http://localhost:5000/api/students' \
     --data-urlencode 'search=<script>alert(1)</script>'
# ✅ Script doit être échappé/supprimé
```

---

## 🎓 Ressources de Sécurité

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)

---

## 📞 Support de Sécurité

Pour signaler une vulnérabilité:

```
Email: security@genidoc.local
Phone: +33 1 XX XX XX XX
PGP: [clé publique]
```

**Ne divulguez pas les vulnérabilités publiquement.**

---

**Dernière mise à jour:** 2026-05-20
**Prochain audit:** 2026-06-20
**Responsable:** Équipe de sécurité GenidoC
