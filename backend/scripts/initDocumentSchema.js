require("dotenv").config();
const fs = require("fs/promises");
const path = require("path");
const db = require("../config/database");

async function main() {
  await fs.mkdir(path.join(__dirname, "..", "..", "storage", "documents"), {
    recursive: true,
  });

  await db.query(`
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
  `);

  console.log("Document schema ready");
}

main()
  .then(() => db.end())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
