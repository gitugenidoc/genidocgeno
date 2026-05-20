require("dotenv").config();
const db = require("../config/database");

async function main() {
  await db.query(`
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
  `);

  console.log("Health schema ready");
}

main()
  .then(() => db.end())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
