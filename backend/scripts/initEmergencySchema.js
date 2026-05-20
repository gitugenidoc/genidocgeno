require("dotenv").config();
const db = require("../config/database");

async function main() {
  await db.query(`
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
  `);

  console.log("Emergency QR schema ready");
}

main()
  .then(() => db.end())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
