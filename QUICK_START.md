# 🚀 GeniDoc - Quick Start Guide

## ⚡ Démarrage en 5 Minutes

### **Prérequis**

- Node.js installé
- PostgreSQL installé
- Terminal

---

## 📦 **Installation Backend**

```bash
# 1. Installer les dépendances
npm install

# 2. Créer fichier .env
cp .env.example .env

# 3. Éditer .env avec vos paramètres PostgreSQL:
#    DB_USER=postgres
#    DB_PASSWORD=votre_password
#    JWT_SECRET=genidoc_secret_key_2026

# 4. Créer la base de données
psql -U postgres -f db/schema.sql

# 5. Démarrer le serveur
npm start
# ✅ Serveur sur http://localhost:5000
```

---

## 🌐 **Accès Frontend**

### **Flux Complet (Nouveau Patient)**

1. Ouvrir: `auth.html`
2. S'inscrire (Email + Password 8+ chars)
3. Compléter onboarding (4 étapes)
4. Voir Dashboard: `f.html`
5. Prendre RDV: Bouton dans sidebar
6. Logout: Dernier bouton sidebar

### **Flux Login (Patient Existant)**

1. Ouvrir: `auth.html`
2. Se connecter (Email + Password)
3. Voir Dashboard: `f.html`

---

## 🧪 **Tester les APIs**

### **1. Enregistrement**

```bash
curl -X POST http://localhost:5000/api/patients/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.fr",
    "password": "Test1234",
    "first_name": "Jean",
    "last_name": "Dupont",
    "phone": "0612345678",
    "date_of_birth": "1990-05-15"
  }'
```

**Response:**

```json
{
  "message": "Patient créé avec succès",
  "token": "eyJhbGc...",
  "patient": {
    "id": 1,
    "email": "patient@test.fr",
    "first_name": "Jean",
    "last_name": "Dupont"
  }
}
```

### **2. Login**

```bash
curl -X POST http://localhost:5000/api/patients/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.fr",
    "password": "Test1234"
  }'
```

**Response:**

```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGc...",
  "patient": {...}
}
```

### **3. Récupérer Médecins**

```bash
curl http://localhost:5000/api/doctors
```

**Response:**

```json
[
  {
    "id": 1,
    "name": "Dr. Marie Dupont",
    "specialty": "Pédiatrie",
    "email": "marie.dupont@hopital.fr",
    "phone": "01-23-45-67-89",
    "years_experience": 15
  },
  ...
]
```

### **4. Créer RDV (avec token)**

```bash
# Remplacer <TOKEN> par le token reçu du login
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

### **5. Récupérer Mes RDVs (avec token)**

```bash
curl http://localhost:5000/api/appointments/my-appointments \
  -H "Authorization: Bearer <TOKEN>"
```

### **6. Récupérer Mon Profil (avec token)**

```bash
curl http://localhost:5000/api/patients/profile \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 📋 **Données de Test**

### **Hôpital Créé**

- **Nom**: Hôpital Central
- **Adresse**: 123 Rue de la Santé, Paris
- **Phone**: 01-23-45-67-89

### **Médecins Créés**

1. **Dr. Marie Dupont**
   - Spécialité: Pédiatrie
   - Email: marie.dupont@hopital.fr
   - Expérience: 15 ans

2. **Dr. Jean Bernard**
   - Spécialité: Cardiologie
   - Email: jean.bernard@hopital.fr
   - Expérience: 20 ans

### **Disponibilités**

- Lundi-Vendredi: 09:00-17:00 (Dr. Dupont)
- Lundi-Vendredi: 10:00-18:00 (Dr. Bernard)

---

## 🗂️ **Structure Fichiers**

```
digiGeniDoc/
├── auth.html                    # Page authentification
├── onboarding.html              # 4 étapes onboarding
├── f.html                       # Dashboard
├── profile.html                 # Profil utilisateur
├── forgot-password.html         # Récupération mot de passe
├── error-404.html               # Page erreur
│
├── backend/
│   ├── server.js                # Entry point Express
│   ├── config/database.js       # Connexion PostgreSQL
│   ├── models/                  # 4 models (Patient, Doctor, Appointment, MedicalRecord)
│   ├── controllers/             # 4 controllers
│   ├── routes/                  # 4 routes
│   └── middleware/auth.js       # JWT middleware
│
├── frontend/
│   ├── pages/
│   │   ├── appointments.html    # Prise de RDV
│   │   ├── my-appointments.html # Mes RDVs
│   │   └── medical-record.html  # Dossier médical
│   └── assets/api.js            # Client API réutilisable
│
├── db/
│   └── schema.sql               # Schéma + données initiales
│
├── package.json
├── README.md
├── AUTHENTICATION.md
└── QUICK_START.md (ce fichier)
```

---

## ✅ **Checklist Démarrage**

- [ ] Node.js installé (`node -v`)
- [ ] PostgreSQL lancé
- [ ] `.env` créé et rempli
- [ ] Base de données créée (`psql -U postgres -f db/schema.sql`)
- [ ] `npm install` terminé
- [ ] `npm start` lancé (terminal voit "✅ GeniDoc API démarrée sur port 5000")
- [ ] `auth.html` ouvert dans navigateur
- [ ] S'inscrire → Onboarding → Dashboard → Prendre RDV fonctionnent
- [ ] Logout fonctionne

---

## 🐛 **Troubleshooting**

### **Erreur: "ECONNREFUSED" au login**

```
❌ Serveur backend ne répond pas
✅ Solution: npm start dans le terminal
```

### **Erreur: "ENOENT: no such file or directory"**

```
❌ Base de données non créée
✅ Solution: psql -U postgres -f db/schema.sql
```

### **Erreur: "Email déjà utilisé"**

```
❌ Email existe déjà en BD
✅ Solution: Utiliser un autre email pour signup
```

### **Bouton Logout ne marche pas**

```
❌ Token pas trouvé dans localStorage
✅ Solution: Se reconnecter via auth.html
```

### **Pages frontend affichent "401 Token invalide"**

```
❌ Token expiré ou corrompu
✅ Solution: Logout + Login
```

---

## 📞 **Support**

Voir `README.md` pour détails complets.  
Voir `AUTHENTICATION.md` pour flux d'auth détaillé.

---

**Version**: 1.0.0  
**Status**: ✅ Production-ready  
**Date**: Mai 2026  
**Hôpital**: Hôpital Central (test)
