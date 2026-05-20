require("dotenv").config();
const db = require("../config/database");

async function main() {
  await db.query(`
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
  `);

  console.log("Incident schema ready");
}

main()
  .then(() => db.end())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
