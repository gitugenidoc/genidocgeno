require("dotenv").config();
const db = require("../config/database");

async function main() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS email_outbox (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      recipient_email VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      sent_at TIMESTAMP,
      failed_at TIMESTAMP,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS account_invitations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      role_code VARCHAR(50) NOT NULL REFERENCES roles(code),
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      token_hash VARCHAR(64) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      accepted_at TIMESTAMP,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS document_retention_policies (
      id SERIAL PRIMARY KEY,
      school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
      document_type VARCHAR(80) NOT NULL,
      retention_months INTEGER NOT NULL,
      legal_basis TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (school_id, document_type)
    );

    CREATE TABLE IF NOT EXISTS legal_consents (
      id SERIAL PRIMARY KEY,
      school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
      guardian_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      consent_type VARCHAR(100) NOT NULL,
      status VARCHAR(30) NOT NULL,
      version VARCHAR(40) NOT NULL,
      signed_at TIMESTAMP,
      revoked_at TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON email_outbox(status);
    CREATE INDEX IF NOT EXISTS idx_account_invitations_email ON account_invitations(LOWER(email));
    CREATE INDEX IF NOT EXISTS idx_legal_consents_school ON legal_consents(school_id);
    CREATE INDEX IF NOT EXISTS idx_legal_consents_student ON legal_consents(student_id);
  `);

  console.log("Production schema ready");
}

main()
  .then(() => db.end())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
