# GeniDoc Hayat - QA, beta et lancement

L'objectif est de lancer une beta fermee fiable avec les parcours sante essentiels.

## 1. QA fonctionnelle

Tester chaque parcours avec un compte reel par role :

- plateforme owner : connexion, audit, supervision globale
- admin ecole : creation ecole, classes, eleves, invitations
- parent : activation, enfant rattache, autorisations, documents
- medecin : profil, patients, rendez-vous, dossiers medicaux
- patient : inscription, connexion, prise de rendez-vous, dossier medical

Critere de sortie : aucun blocage sur connexion, donnees medicales, rendez-vous, documents et autorisations.

## 2. Securite

- Verifier que `JWT_SECRET`, `SESSION_SECRET` et `STORAGE_ENCRYPTION_KEY` viennent du coffre de secrets.
- Lancer en production uniquement avec `NODE_ENV=production`.
- Configurer `CORS_ORIGIN` avec le domaine final.
- Verifier que chaque API sensible exige un role ou une session.
- Confirmer que `/storage/documents` n'est jamais expose directement.
- Tester reset password, invitation et deconnexion sur tous les roles.

## 3. Monitoring

Endpoints disponibles :

- `GET /api/health` : etat applicatif, uptime et environnement
- `GET /api/ready` : disponibilite backend + PostgreSQL

Exploitation minimale :

- logs backend centralises
- alerte si `/api/ready` retourne 503
- sauvegarde PostgreSQL quotidienne avec test de restauration mensuel
- suivi des erreurs 401/403/500

## 4. Deploiement beta

Avant beta :

- base PostgreSQL production creee
- schemas initialises
- compte `PLATFORM_OWNER` cree
- HTTPS actif
- sauvegarde testee
- emails transactionnels connectes au worker `email_outbox`

Commande d'initialisation :

```bash
npm run db:init:auth
npm run db:init:school
npm run db:init:production
npm run bootstrap:admin
```

## 5. Validation metier

Faire valider avec un petit groupe pilote :

- 1 responsable plateforme
- 1 admin ecole
- 1 infirmier ou responsable sante
- 2 parents
- 1 medecin

Collecter les retours sur les champs medicaux, les autorisations parentales, l'urgence QR et les documents.

## 6. Lancement

Ne pas lancer publiquement tant que :

- les roles et permissions sont valides
- les donnees demo sont purgees
- les CGU et la politique de confidentialite sont pretes
- le support WhatsApp/email est defini
- la procedure de restauration base de donnees a ete testee

Cette phase reste centree sur la stabilite, la securite et la validation metier.
