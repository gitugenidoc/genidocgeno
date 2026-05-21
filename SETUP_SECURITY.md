# 🔒 SETUP SECURITY - Guide d'Installation Sécurisée

## ⚠️ IMPORTANT: Lire AVANT le déploiement!

---

## 📋 Pre-requisites

```bash
# Node.js 16+
node --version  # v16.0.0 ou plus

# npm 8+
npm --version   # 8.0.0 ou plus

# PostgreSQL 13+
psql --version  # 13.0 ou plus
```

---

## 🚀 Installation Rapide (DEV)

```bash
# 1. Cloner le repo
git clone https://github.com/yourusername/genidoc.git
cd genidoc

# 2. Installer les dépendances
npm install

# 3. Copier .env.example → .env
cp .env.example .env

# 4. ÉDITER .env avec des valeurs de dev
# (Utiliser les valeurs par défaut pour développement local)

# 5. Démarrer
npm run dev
```

---

## 🔐 Installation Production (SÉCURISÉE)

### Étape 1: Préparation du Serveur

```bash
# 1. Créer un utilisateur dédié
sudo useradd -m -s /bin/bash genidoc

# 2. Créer les répertoires
sudo mkdir -p /var/genidoc/logs
sudo mkdir -p /var/genidoc/uploads
sudo mkdir -p /var/genidoc/backups
sudo chown -R genidoc:genidoc /var/genidoc
sudo chmod 700 /var/genidoc

# 3. Cloner en tant que genidoc
sudo -u genidoc git clone https://github.com/yourusername/genidoc.git /var/genidoc/app
cd /var/genidoc/app
```

### Étape 2: Configurer les Secrets

```bash
# 1. Générer des secrets forts
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
DB_PASSWORD=$(openssl rand -base64 32)

# 2. Afficher les secrets (À SAUVEGARDER DANS UN GESTIONNAIRE DE SECRETS)
echo "JWT_SECRET=$JWT_SECRET"
echo "SESSION_SECRET=$SESSION_SECRET"
echo "STORAGE_ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "DB_PASSWORD=$DB_PASSWORD"

# 3. Créer .env sécurisé (Jamais en Git!)
sudo tee /var/genidoc/app/.env > /dev/null << EOF
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=genidoc_prod
DB_USER=genidoc_user
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET
STORAGE_ENCRYPTION_KEY=$ENCRYPTION_KEY
CORS_ORIGIN=https://app.genidoc.local
FRONTEND_URL=https://app.genidoc.local
EOF

# 4. Sécuriser le fichier .env
sudo chmod 600 /var/genidoc/app/.env
sudo chown genidoc:genidoc /var/genidoc/app/.env
```

### Étape 3: Installer les Dépendances

```bash
# 1. Installer npm packages
cd /var/genidoc/app
sudo -u genidoc npm ci --production

# 2. Vérifier l'installation
npm list | grep helmet
npm list | grep express-rate-limit
npm list | grep hpp
```

### Étape 4: Configurer la Base de Données

```bash
# 1. Créer utilisateur PostgreSQL
sudo -u postgres psql << EOF
CREATE USER genidoc_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
CREATE DATABASE genidoc_prod OWNER genidoc_user;
GRANT CONNECT ON DATABASE genidoc_prod TO genidoc_user;
EOF

# 2. Initialiser le schéma
cd /var/genidoc/app
sudo -u genidoc npm run db:init:production

# 3. Créer admin initial
sudo -u genidoc npm run bootstrap:admin
```

### Étape 5: Configurer Nginx (Reverse Proxy)

```bash
# 1. Installer Nginx
sudo apt-get install nginx

# 2. Créer configuration
sudo tee /etc/nginx/sites-available/genidoc > /dev/null << 'EOF'
# ========================
# GenidoC API Reverse Proxy
# ========================

upstream genidoc_api {
    server 127.0.0.1:5000;
    keepalive 32;
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name api.genidoc.local;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.genidoc.local;

    # SSL/TLS Configuration
    ssl_certificate /etc/letsencrypt/live/api.genidoc.local/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.genidoc.local/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Request size limit
    client_max_body_size 10M;
    client_body_timeout 10s;
    client_header_timeout 10s;

    # Logging
    access_log /var/log/nginx/genidoc_access.log;
    error_log /var/log/nginx/genidoc_error.log;

    # Proxy to Node.js
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
EOF

# 3. Activer la configuration
sudo ln -s /etc/nginx/sites-available/genidoc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Étape 6: Obtenir Certificat SSL (Let's Encrypt)

```bash
# 1. Installer certbot
sudo apt-get install certbot python3-certbot-nginx

# 2. Obtenir le certificat
sudo certbot certonly --webroot -w /var/www/certbot \
  -d api.genidoc.local \
  -d app.genidoc.local

# 3. Auto-renouvellement
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Étape 7: Configurer Systemd Service

```bash
# 1. Créer le service
sudo tee /etc/systemd/system/genidoc.service > /dev/null << EOF
[Unit]
Description=GenidoC API Service
After=network.target postgresql.service

[Service]
Type=simple
User=genidoc
WorkingDirectory=/var/genidoc/app
ExecStart=/usr/bin/node backend/server.js
Restart=on-failure
RestartSec=5

# Security
PrivateTmp=yes
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/genidoc/logs /var/genidoc/uploads

# Resource limits
LimitNOFILE=4096
LimitNPROC=512

StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 2. Activer et démarrer
sudo systemctl daemon-reload
sudo systemctl enable genidoc.service
sudo systemctl start genidoc.service

# 3. Vérifier le statut
sudo systemctl status genidoc.service
```

### Étape 8: Configurer le Firewall

```bash
# 1. Enable UFW
sudo ufw enable

# 2. Ouvrir ports nécessaires
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 5432/tcp # PostgreSQL (localhost seulement)

# 3. Restreindre PostgreSQL au localhost
sudo ufw allow from 127.0.0.1 to 127.0.0.1 port 5432

# 4. Vérifier
sudo ufw status
```

### Étape 9: Sauvegarder et Monitorer

```bash
# 1. Sauvegarder les secrets
# ⚠️  À garder dans un coffre-fort (AWS Secrets Manager, Vault, etc.)

# 2. Configurer la rotation des secrets
# À faire tous les 90 jours ou après incident

# 3. Monitorer les logs
sudo tail -f /var/log/nginx/genidoc_access.log
sudo tail -f /var/log/nginx/genidoc_error.log
sudo journalctl -u genidoc.service -f

# 4. Audit périodique
sudo npm audit
npm update --save
```

---

## ✅ Vérification de Sécurité

### Tests Post-Installation

```bash
# 1. Test HTTPS
curl -I https://api.genidoc.local/api/health

# 2. Test Headers
curl -I https://api.genidoc.local/api/health | grep -i "strict-transport"

# 3. Test Rate Limiting
for i in {1..110}; do curl https://api.genidoc.local/api/health; done

# 4. Test Fichiers Sensibles
curl https://api.genidoc.local/.env           # Doit retourner 403
curl https://api.genidoc.local/package.json   # Doit retourner 403

# 5. Test HTML Access
curl -I https://api.genidoc.local/index.html  # Doit retourner 404
curl -I https://api.genidoc.local/            # Doit retourner 200

# 6. Test CORS
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: POST" \
     https://api.genidoc.local/api/students

# 7. SSL/TLS Test
openssl s_client -connect api.genidoc.local:443 -tls1_2
```

---

## 🔄 Maintenance Régulière

### Daily

```bash
# Vérifier les logs
grep "\[SECURITY\]" /var/log/nginx/*.log

# Vérifier le service
sudo systemctl status genidoc.service
```

### Weekly

```bash
# Backup base de données
sudo -u genidoc npm run backup:pg

# Vérifier les certificats
sudo certbot certificates
```

### Monthly

```bash
# Audit de sécurité
npm audit
npm update

# Rotation des logs
sudo logrotate -f /etc/logrotate.d/genidoc
```

### Quarterly (90 days)

```bash
# Rotation des secrets
NODE_ENV=production npm run secret:rotate

# Security review
npm audit --audit-level=moderate
```

---

## 🚨 Troubleshooting

### Service ne démarre pas

```bash
# Vérifier les erreurs
sudo journalctl -u genidoc.service -n 50 --no-pager

# Vérifier les permissions
ls -la /var/genidoc/app/.env

# Vérifier les secrets
source /var/genidoc/app/.env && echo "✅ Secrets OK"
```

### Erreurs de connexion HTTPS

```bash
# Vérifier le certificat
sudo openssl x509 -in /etc/letsencrypt/live/api.genidoc.local/fullchain.pem -text -noout

# Vérifier Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Performance

```bash
# Vérifier les ressources
top -p $(pgrep -f "node backend/server.js")

# Vérifier les connexions
netstat -an | grep ESTABLISHED | wc -l

# Vérifier les logs de rate limiting
grep "rate limit" /var/log/nginx/genidoc_access.log
```

---

## 📞 Support

Pour questions ou problèmes de sécurité:

- Email: security@genidoc.local
- Documenter: Issue + Logs + Config (sans secrets!)

---

**Dernière mise à jour:** 2026-05-20
**Version:** 1.0.0
**Auteur:** Équipe de sécurité GenidoC
