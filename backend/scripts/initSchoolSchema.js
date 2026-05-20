require("dotenv").config();
const db = require("../config/database");

async function main() {
  await db.query(`
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
    CREATE INDEX IF NOT EXISTS idx_emergency_contacts_student ON emergency_contacts(student_id);
  `);

  console.log("School schema ready");
}

main()
  .then(() => db.end())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
