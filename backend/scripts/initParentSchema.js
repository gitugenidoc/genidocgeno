require("dotenv").config();
const db = require("../config/database");

async function main() {
  await db.query(`
    ALTER TABLE guardians
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

    UPDATE guardians g
    SET user_id = u.id
    FROM users u
    WHERE g.user_id IS NULL
      AND g.email IS NOT NULL
      AND LOWER(g.email) = LOWER(u.email);

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

    CREATE INDEX IF NOT EXISTS idx_guardians_user ON guardians(user_id);
    CREATE INDEX IF NOT EXISTS idx_parent_authorizations_student
      ON parent_authorizations(student_id);
    CREATE INDEX IF NOT EXISTS idx_parent_authorizations_user
      ON parent_authorizations(guardian_user_id);
  `);

  console.log("Parent schema ready");
}

main()
  .then(() => db.end())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
