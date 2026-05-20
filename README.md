# GeniDoc - Système de Gestion Dossier Patient & Prise de RDV

## 📋 Architecture

**Hôpital unique** avec:

- Médecins et leurs disponibilités
- Patients avec authentification
- RDVs avec statut (pending, confirmed, completed, cancelled)
- Dossiers médicaux informatisés

## 🗂️ Structure Projet

```
digiGeniDoc/
├── backend/                    # API Node.js + Express
│   ├── config/database.js     # Connexion PostgreSQL
│   ├── models/                # Modèles BD
│   ├── controllers/           # Logique métier
│   ├── routes/                # Endpoints API
│   ├── middleware/auth.js     # JWT auth
│   └── server.js              # Entry point
├── db/schema.sql              # Schéma PostgreSQL + données initiales
├── frontend/                  # UI patient
│   ├── pages/
│   │   ├── appointments.html  # Prise de RDV
│   │   ├── my-appointments.html # Mes RDVs
│   │   └── medical-record.html  # Dossier patient
│   └── assets/api.js          # Client API
├── package.json               # Dépendances
└── .env.example               # Variables d'environnement
```

## 🚀 Installation

### 1. Setup Base de Données (PostgreSQL)

```bash
# Créer la BD et tables
psql -U postgres -f db/schema.sql
```

Données initiales incluses:

- Hôpital: "Hôpital Central"
- Médecins: Dr. Marie Dupont (Pédiatrie), Dr. Jean Bernard (Cardiologie)

### 2. Setup Backend

```bash
# Installer dépendances
npm install

# Créer .env
cp .env.example .env

# Éditer .env avec vos paramètres:
# - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
# - PORT (par défaut 5000)
# - JWT_SECRET (générer une clé)

# Démarrer serveur
npm start
# ou mode dev avec nodemon:
npm run dev
```

### 3. Frontend

Les pages HTML sont prêtes à l'emploi. Elles se connectent à `http://localhost:5000/api`

Ouvrir:

- `frontend/pages/appointments.html` - Prise RDV
- `frontend/pages/my-appointments.html` - Mes RDVs
- `frontend/pages/medical-record.html` - Dossier médical

## 🔌 APIs Disponibles

### Authentification Patient

```
POST   /api/patients/register      # Créer compte
POST   /api/patients/login         # Se connecter
GET    /api/patients/profile       # Récupérer profil (protected)
PUT    /api/patients/profile       # Mettre à jour (protected)
```

### Médecins

```
GET    /api/doctors                # Liste tous les médecins
GET    /api/doctors/:id            # Récupérer un médecin
GET    /api/doctors/:id/availability # Disponibilités
```

### Rendez-vous

```
POST   /api/appointments           # Créer RDV (protected)
GET    /api/appointments/my-appointments # Mes RDVs (protected)
GET    /api/appointments/available # RDVs disponibles
GET    /api/appointments/:id       # Détail RDV (protected)
PUT    /api/appointments/:id/confirm # Confirmer RDV (protected)
DELETE /api/appointments/:id       # Annuler RDV (protected)
```

### Dossier Médical

```
POST   /api/medical-records        # Créer dossier (médecin)
GET    /api/medical-records/my-records # Mon dossier (protected)
GET    /api/medical-records/:id    # Détail dossier (protected)
PUT    /api/medical-records/:id    # Mettre à jour (médecin)
```

## 🔒 Authentification

- **Type**: JWT (Bearer token)
- **Header**: `Authorization: Bearer <token>`
- **Durée**: 7 jours
- **Token**: Fourni par `/api/patients/login` et `/api/patients/register`

Après login, le token est stocké dans `localStorage` automatiquement.

## 📊 Modèles Données

### Hospitals

```sql
- id, name, address, city, phone, email
```

### Doctors

```sql
- id, hospital_id, name, specialty, phone, email, years_experience
```

### Patients

```sql
- id, hospital_id, email, password_hash, first_name, last_name, phone
- date_of_birth, blood_type, allergies, chronic_diseases, insurance_number
```

### Appointments

```sql
- id, patient_id, doctor_id, hospital_id, appointment_date, appointment_time
- status (pending/confirmed/completed/cancelled), reason, notes
```

### Medical Records

```sql
- id, patient_id, doctor_id, hospital_id, appointment_id, visit_date
- reason_for_visit, symptoms, diagnosis, treatment, medications, notes
```

## 🧪 Tester

### Exemple: Créer un patient + Prendre RDV

```bash
# 1. Enregistrement
curl -X POST http://localhost:5000/api/patients/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.fr",
    "password": "SecurePass123!",
    "first_name": "Jean",
    "last_name": "Dupont",
    "phone": "0612345678",
    "date_of_birth": "1990-05-15"
  }'

# Response:
# {
#   "message": "Patient créé avec succès",
#   "token": "eyJhbGc...",
#   "patient": {...}
# }

# 2. Récupérer médecins
curl http://localhost:5000/api/doctors

# 3. Prendre RDV (remplacer TOKEN)
curl -X POST http://localhost:5000/api/appointments \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": 1,
    "appointment_date": "2026-05-25",
    "appointment_time": "10:00",
    "reason": "Consultation générale"
  }'
```

## 🎯 Flux Principal

### Patient:

1. ✅ S'enregistre (page auth.html)
2. ✅ Prend RDV (appointments.html) - Sélectionne médecin, date, heure
3. ✅ Confirme RDV (my-appointments.html) - Reçoit confirmation
4. ✅ Consulte dossier (medical-record.html) - Voir historique visites

### Médecin (côté serveur API):

1. Crée dossier médical après consultation
2. Enregistre diagnostic, traitement, médicaments

## 🔐 Sécurité

- ✅ Mots de passe hashés (bcryptjs)
- ✅ JWT tokens
- ✅ CORS configuré
- ✅ Requêtes protégées par middleware auth

## 📝 Notes Importantes

- **Base de données**: PostgreSQL (adapter `db/schema.sql` si MySQL)
- **CORS**: Configuré pour localhost:5000 → frontend
- **Token JWT**: À changer en production (`JWT_SECRET`)
- **Email**: Pas d'intégration email dans cette version (ajouter service en prod)

## 🚀 Prochaines Étapes

- [ ] Intégration email (confirmation RDV, rappels)
- [ ] Historique audit
- [ ] Upload documents médicaux
- [ ] SMS rappels RDV
- [ ] Interface médecin
- [ ] Interface admin hôpital
- [ ] Multi-hôpitaux support
- [ ] Beta fermee avec medecins, parents et etablissements pilotes

## 📞 Support

Pour questions sur le code: regarder les commentaires dans les controllers et models.

---

**Version**: 1.0.0  
**Date**: Mai 2026  
**Statut**: ✅ Production-ready pour hôpital unique
