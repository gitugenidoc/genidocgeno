require("dotenv").config();
const db = require("../config/database");

async function main() {
  await db.query(`
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
  `);

  await db.query("DELETE FROM sessions WHERE expires_at <= NOW() OR revoked_at IS NOT NULL");
  console.log("Audit schema ready");
}

main()
  .then(() => db.end())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
