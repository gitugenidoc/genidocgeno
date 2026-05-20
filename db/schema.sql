-- PostgreSQL schema for GeniDoc

CREATE TABLE IF NOT EXISTS hospitals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
  id SERIAL PRIMARY KEY,
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(100) NOT NULL DEFAULT 'Pédiatrie',
  phone VARCHAR(20),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  bio TEXT,
  years_experience INTEGER,
  clinic_name VARCHAR(255),
  clinic_address TEXT,
  clinic_city VARCHAR(100),
  clinic_phone VARCHAR(20),
  appointment_duration INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS private_pediatric_clinics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  address TEXT,
  city VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  website TEXT,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(10),
  blood_type VARCHAR(5),
  allergies TEXT,
  chronic_diseases TEXT,
  insurance_number VARCHAR(100),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id),
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER DEFAULT 30,
  status VARCHAR(50) DEFAULT 'pending',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medical_records (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id),
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
  appointment_id INTEGER REFERENCES appointments(id),
  visit_date DATE NOT NULL,
  reason_for_visit TEXT,
  symptoms TEXT,
  diagnosis TEXT,
  treatment TEXT,
  medications TEXT,
  test_results TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_availability (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_date ON medical_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_doctors_hospital ON doctors(hospital_id);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  address TEXT,
  phone VARCHAR(30),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  school_id INTEGER REFERENCES schools(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);

CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  level VARCHAR(100),
  academic_year VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  deleted_at TIMESTAMP,
  UNIQUE (school_id, name, academic_year)
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  identifier VARCHAR(80),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  deleted_at TIMESTAMP,
  UNIQUE (school_id, identifier)
);

CREATE TABLE IF NOT EXISTS guardians (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guardians_email_unique
  ON guardians (LOWER(email))
  WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS student_guardian_links (
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  guardian_id INTEGER NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
  relationship VARCHAR(80) NOT NULL DEFAULT 'Parent',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  PRIMARY KEY (student_id, guardian_id)
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  relationship VARCHAR(80),
  phone VARCHAR(30) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_guardians_school ON guardians(school_id);
CREATE INDEX IF NOT EXISTS idx_guardians_user ON guardians(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_student ON emergency_contacts(student_id);

CREATE TABLE IF NOT EXISTS health_profiles (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  blood_type VARCHAR(5),
  regular_treatment TEXT,
  medical_diet TEXT,
  emergency_protocol TEXT,
  treating_doctor_name VARCHAR(160),
  treating_doctor_phone VARCHAR(30),
  treating_doctor_clinic VARCHAR(255),
  critical_notes TEXT,
  access_level VARCHAR(30) NOT NULL DEFAULT 'restricted',
  is_sensitive BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS allergies (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  allergen VARCHAR(160) NOT NULL,
  severity VARCHAR(40) NOT NULL DEFAULT 'non_renseigné',
  reaction TEXT,
  notes TEXT,
  access_level VARCHAR(30) NOT NULL DEFAULT 'restricted',
  is_sensitive BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS health_conditions (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  condition_name VARCHAR(160) NOT NULL,
  severity VARCHAR(40) NOT NULL DEFAULT 'non_renseigné',
  notes TEXT,
  access_level VARCHAR(30) NOT NULL DEFAULT 'restricted',
  is_sensitive BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS medications (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  medication_name VARCHAR(160) NOT NULL,
  dosage VARCHAR(120),
  frequency VARCHAR(120),
  notes TEXT,
  access_level VARCHAR(30) NOT NULL DEFAULT 'restricted',
  is_sensitive BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS medical_notes (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  access_level VARCHAR(30) NOT NULL DEFAULT 'restricted',
  is_sensitive BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_health_profiles_student ON health_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_health_profiles_school ON health_profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_allergies_student ON allergies(student_id);
CREATE INDEX IF NOT EXISTS idx_conditions_student ON health_conditions(student_id);
CREATE INDEX IF NOT EXISTS idx_medications_student ON medications(student_id);
CREATE INDEX IF NOT EXISTS idx_medical_notes_student ON medical_notes(student_id);

CREATE TABLE IF NOT EXISTS parent_authorizations (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  guardian_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emergency_care_authorized BOOLEAN NOT NULL DEFAULT FALSE,
  medication_authorized BOOLEAN NOT NULL DEFAULT FALSE,
  school_trip_authorized BOOLEAN NOT NULL DEFAULT FALSE,
  medical_info_sharing_authorized BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id),
  UNIQUE (student_id, guardian_user_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_authorizations_student
  ON parent_authorizations(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_authorizations_user
  ON parent_authorizations(guardian_user_id);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  document_type VARCHAR(80) NOT NULL DEFAULT 'autre',
  title VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  encryption_tag TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  access_level VARCHAR(30) NOT NULL DEFAULT 'restricted',
  is_sensitive BOOLEAN NOT NULL DEFAULT TRUE,
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_versions (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  encryption_iv TEXT NOT NULL,
  encryption_tag TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (document_id, version_number)
);

CREATE TABLE IF NOT EXISTS document_access_logs (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(80) NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_student ON documents(student_id);
CREATE INDEX IF NOT EXISTS idx_documents_school ON documents(school_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_document
  ON document_access_logs(document_id);

CREATE TABLE IF NOT EXISTS qr_tokens (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  token_preview VARCHAR(12) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  revoked_by INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qr_scan_events (
  id SERIAL PRIMARY KEY,
  qr_token_id INTEGER REFERENCES qr_tokens(id) ON DELETE SET NULL,
  student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qr_tokens_student ON qr_tokens(student_id);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_hash ON qr_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_qr_scan_events_student ON qr_scan_events(student_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_events_token ON qr_scan_events(qr_token_id);

CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  incident_type VARCHAR(80) NOT NULL DEFAULT 'autre',
  severity VARCHAR(40) NOT NULL DEFAULT 'faible',
  status VARCHAR(40) NOT NULL DEFAULT 'open',
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  location VARCHAR(255),
  parent_notified_at TIMESTAMP,
  resolved_at TIMESTAMP,
  access_level VARCHAR(30) NOT NULL DEFAULT 'restricted',
  is_sensitive BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incident_actions (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  action_type VARCHAR(80) NOT NULL DEFAULT 'note',
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS incident_attachments (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_incidents_school ON incidents(school_id);
CREATE INDEX IF NOT EXISTS idx_incidents_student ON incidents(student_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incident_actions_incident ON incident_actions(incident_id);

CREATE TABLE IF NOT EXISTS audit_events (
  id BIGSERIAL PRIMARY KEY,
  school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'success',
  entity_type VARCHAR(80),
  entity_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_events_school ON audit_events(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_user ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_student ON audit_events(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at);

INSERT INTO hospitals (id, name, address, city, phone, email) VALUES
(1, 'GeniDoc Network', 'Casablanca', 'Casablanca', '00-00-00-00-00', 'contact@genidoc.local')
ON CONFLICT (id) DO NOTHING;

INSERT INTO private_pediatric_clinics (name, address, city, phone, website, source_url) VALUES
('Clinique Pédiatrique ATFAL', 'Oasis', 'Casablanca', NULL, 'https://cliniqueatfal.ma/', 'https://cliniqueatfal.ma/'),
('Clinique Avicenne', 'Angle Avenue Nador, Bd de l''Atlantide', 'Casablanca', NULL, 'https://cliniqueavicenne.ma/', 'https://cliniqueavicenne.ma/'),
('Clinique Dar Salam', '728 Boulevard Modibo Keita', 'Casablanca', NULL, 'https://cliniquedarsalam.com/', 'https://cliniquedarsalam.com/'),
('Cabinet Dr Kaddouri Boubkeur', NULL, 'Casablanca', NULL, 'https://www.pediatre-dr-kaddouri.com/', 'https://www.pediatre-dr-kaddouri.com/'),
('Cabinet de Pédiatrie Dr Mikou', NULL, 'Casablanca', NULL, 'https://www.pediatre-casablanca-mikou.com/', 'https://www.pediatre-casablanca-mikou.com/'),
('Allo mon Pédiatre', NULL, 'Casablanca', NULL, 'https://allomonpediatre.com/', 'https://allomonpediatre.com/')
ON CONFLICT (name) DO NOTHING;
