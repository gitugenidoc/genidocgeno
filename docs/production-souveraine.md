# GeniDoc Hayat - Production souveraine

Objectif : heberger le frontend, le backend, PostgreSQL, les documents chiffres, les sauvegardes et les journaux dans une infrastructure controlee, avec des donnees stockees dans la juridiction choisie.

## Architecture cible

```text
Internet
  -> Reverse proxy HTTPS souverain
  -> Frontend statique HTML/CSS/JS
  -> Backend Node.js Express
  -> PostgreSQL prive
  -> Stockage documents chiffre
  -> Sauvegardes chiffrees
```

Le backend ne doit jamais exposer directement le dossier `storage/documents`. Les telechargements passent toujours par l'API, qui verifie le role et journalise l'acces.

## Roles production

- `PLATFORM_OWNER` : SENHAJI Anas uniquement. Acces audit global et supervision.
- `GENIDOC_ADMIN` : cree les ecoles et les admins ecole, sans acces audit global.
- `SCHOOL_ADMIN` : gere son ecole, ses classes, eleves, parents et staff.
- `SCHOOL_NURSE` : accede aux informations utiles de son ecole.
- `PARENT` : accede uniquement a ses enfants.
- `PEDIATRICIAN` : acces limite aux dossiers autorises.

## Initialisation production

1. Creer la base PostgreSQL.
2. Renseigner les variables de `.env.production.example` dans le coffre de secrets de l'hebergeur.
3. Lancer :

```bash
npm run db:init:auth
npm run db:init:school
npm run db:init:production
npm run bootstrap:admin
```

`bootstrap:admin` cree le compte `PLATFORM_OWNER` a partir de :

```env
PLATFORM_OWNER_EMAIL=
PLATFORM_OWNER_PASSWORD=
PLATFORM_OWNER_FIRST_NAME=SENHAJI
PLATFORM_OWNER_LAST_NAME=Anas
```

## HTTPS

Le TLS doit etre termine par le reverse proxy de production. Le backend force HTTPS quand `NODE_ENV=production` et que `x-forwarded-proto` n'est pas `https`.

Exigences :

- certificat TLS valide
- HSTS actif
- cookies `Secure` en production
- CORS limite a `CORS_ORIGIN`

## Sauvegardes PostgreSQL

Commande :

```bash
npm run backup:pg
```

Plan minimum :

- sauvegarde quotidienne
- retention 30 jours
- copie hors serveur principal
- chiffrement au repos
- test de restauration mensuel

## Monitoring

Le reverse proxy ou l'outil de supervision doit appeler :

- `/api/health` pour verifier que l'API repond
- `/api/ready` pour verifier que l'API et PostgreSQL sont disponibles

Une erreur 503 sur `/api/ready` doit declencher une alerte.

## Invitations et emails

Le backend ecrit les emails dans `email_outbox`. Un worker souverain doit lire les lignes `pending`, envoyer via SMTP prive, puis passer le statut a `sent`.

Types couverts :

- invitation parent/staff
- activation compte
- reset password

## Reset password

Flux :

1. `POST /api/auth/forgot-password`
2. token opaque stocke hashe
3. email depose dans `email_outbox`
4. `POST /api/auth/reset-password`
5. sessions existantes revoquees

## Politique documents

La table `document_retention_policies` stocke la duree de conservation par type de document et par ecole. Aucune suppression automatique ne doit etre activee avant validation juridique.

## Consentements

La table `legal_consents` journalise les consentements parentaux :

- autorisation soins urgence
- partage informations medicales avec l'ecole
- autorisation medicament
- documents fournis par le parent

Chaque consentement doit garder version, date, statut, adresse IP et user-agent.
