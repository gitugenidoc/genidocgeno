# Deploiement OCI Always Free - GeniDoc Hayat

Objectif : demarrer sans budget sur une seule VM OCI Always Free, en gardant une architecture simple et migrable plus tard vers une production plus robuste.

Region cible recommandee : `af-casablanca-1` si les ressources Always Free sont disponibles dans ton compte. Sinon, utiliser une autre region Always Free temporairement, puis migrer vers Casablanca quand possible.

## Architecture V0 gratuite

```text
Internet
  -> Nginx HTTPS
  -> Frontend statique
  -> Backend Node.js avec PM2
  -> PostgreSQL local sur la meme VM
  -> storage/documents chiffre local
  -> backups PostgreSQL locaux
```

Cette architecture est bonne pour preproduction/pilote non sensible. Pour des donnees sante reelles, il faudra ajouter sauvegarde externe, durcissement complet, monitoring et politique de restauration.

## Etape 1 - Creer le compte OCI

1. Creer un compte Oracle Cloud Free Tier.
2. Choisir comme home region `Morocco West (Casablanca)` si propose.
3. Dans OCI, verifier que la region active est `af-casablanca-1`.
4. Ne creer que des ressources marquees `Always Free Eligible`.

## Etape 2 - Creer la VM gratuite

Recommandation :

- Image : Ubuntu 22.04 LTS ou 24.04 LTS
- Shape : Ampere A1 Flex si disponible en Always Free
- OCPU/RAM : commencer petit, par exemple 1 OCPU / 6 GB RAM
- Disque boot : rester dans les limites Always Free
- VCN : creer automatiquement
- SSH : ajouter ta cle publique

Ouvrir seulement :

- `22/tcp` pour SSH, idealement limite a ton IP
- `80/tcp` pour HTTP
- `443/tcp` pour HTTPS

## Etape 3 - Installer la base serveur

Sur la VM :

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y nginx postgresql postgresql-contrib git curl ufw
```

Installer Node.js LTS :

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Firewall :

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Etape 4 - Creer PostgreSQL

```bash
sudo -u postgres psql
```

Dans PostgreSQL :

```sql
CREATE USER genidoc_app WITH PASSWORD 'REMPLACER_MOT_DE_PASSE_FORT';
CREATE DATABASE genidoc_hayat OWNER genidoc_app;
\q
```

## Etape 5 - Installer le projet

```bash
cd /srv
sudo mkdir genidoc
sudo chown $USER:$USER genidoc
cd genidoc
git clone TON_REPO_URL .
npm install --omit=dev
```

Si tu n'as pas encore Git, copier le dossier projet sur le serveur avec `scp`.

## Etape 6 - Configurer `.env`

Creer :

```bash
nano .env
```

Exemple :

```env
NODE_ENV=production
PORT=5000

PUBLIC_APP_URL=https://ton-domaine.ma
FRONTEND_URL=https://ton-domaine.ma
CORS_ORIGIN=https://ton-domaine.ma

DB_HOST=localhost
DB_PORT=5432
DB_NAME=genidoc_hayat
DB_USER=genidoc_app
DB_PASSWORD=REMPLACER_MOT_DE_PASSE_FORT

JWT_SECRET=REMPLACER_64_CARACTERES_ALEATOIRES
SESSION_SECRET=REMPLACER_64_CARACTERES_ALEATOIRES

STORAGE_PATH=/srv/genidoc/storage/documents
STORAGE_ENCRYPTION_KEY=REMPLACER_CLE_32_BYTES_MINIMUM

BACKUP_DIR=/srv/genidoc/backups

PLATFORM_OWNER_EMAIL=ton-email-officiel
PLATFORM_OWNER_PASSWORD=mot-de-passe-final-fort
PLATFORM_OWNER_FIRST_NAME=SENHAJI
PLATFORM_OWNER_LAST_NAME=Anas
```

Generer les secrets :

```bash
openssl rand -base64 48
openssl rand -base64 48
openssl rand -base64 32
```

## Etape 7 - Initialiser la base

```bash
npm run db:init:auth
npm run db:init:school
npm run db:init:production
npm run bootstrap:admin
```

## Etape 8 - Lancer le backend

```bash
pm2 start backend/server.js --name genidoc
pm2 save
pm2 startup
```

Verifier :

```bash
curl http://localhost:5000/api/health
```

## Etape 9 - Configurer Nginx

Créer :

```bash
sudo nano /etc/nginx/sites-available/genidoc
```

Contenu :

```nginx
server {
    listen 80;
    server_name ton-domaine.ma www.ton-domaine.ma;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activer :

```bash
sudo ln -s /etc/nginx/sites-available/genidoc /etc/nginx/sites-enabled/genidoc
sudo nginx -t
sudo systemctl reload nginx
```

## Etape 10 - HTTPS gratuit

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ton-domaine.ma -d www.ton-domaine.ma
```

## Etape 11 - Backups gratuits

Créer :

```bash
mkdir -p /srv/genidoc/backups
```

Cron quotidien :

```bash
crontab -e
```

Ajouter :

```cron
0 3 * * * cd /srv/genidoc && npm run backup:pg >> /srv/genidoc/backups/backup.log 2>&1
```

Important : telecharger regulierement une copie des backups hors serveur. Sur une seule VM gratuite, si la VM est perdue, les backups locaux peuvent etre perdus aussi.

## Etape 12 - Verification

```bash
curl https://ton-domaine.ma/api/health
pm2 status
sudo systemctl status nginx
```

Puis ouvrir :

```text
https://ton-domaine.ma/app/auth/login.html
```

Compte proprietaire :

```text
Email : PLATFORM_OWNER_EMAIL
Mot de passe : PLATFORM_OWNER_PASSWORD
```
