require("dotenv").config();
const db = require("../config/database");

const demoEmails = [
  "admin.school@genidoc.local",
  "nurse@genidoc.local",
  "parent@genidoc.local",
  "pediatre@genidoc.local",
  "admin@genidoc.local",
];

async function main() {
  await db.query("UPDATE classes SET created_by = NULL, updated_by = NULL WHERE created_by IN (SELECT id FROM users WHERE email = ANY($1)) OR updated_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE students SET created_by = NULL, updated_by = NULL WHERE created_by IN (SELECT id FROM users WHERE email = ANY($1)) OR updated_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE guardians SET created_by = NULL, updated_by = NULL WHERE created_by IN (SELECT id FROM users WHERE email = ANY($1)) OR updated_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE guardians SET user_id = NULL WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE emergency_contacts SET created_by = NULL, updated_by = NULL WHERE created_by IN (SELECT id FROM users WHERE email = ANY($1)) OR updated_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE student_guardian_links SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE health_profiles SET created_by = NULL, updated_by = NULL WHERE created_by IN (SELECT id FROM users WHERE email = ANY($1)) OR updated_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE allergies SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE health_conditions SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE medications SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE medical_notes SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE incidents SET created_by = NULL, updated_by = NULL WHERE created_by IN (SELECT id FROM users WHERE email = ANY($1)) OR updated_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE incident_actions SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE incident_attachments SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE qr_tokens SET created_by = NULL, revoked_by = NULL WHERE created_by IN (SELECT id FROM users WHERE email = ANY($1)) OR revoked_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE documents SET uploaded_by = NULL WHERE uploaded_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE document_versions SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE document_access_logs SET user_id = NULL WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("UPDATE parent_authorizations SET updated_by = NULL WHERE updated_by IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query(
    "DELETE FROM password_reset_tokens WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1))",
    [demoEmails],
  );
  await db.query("DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1))", [demoEmails]);
  await db.query("DELETE FROM users WHERE email = ANY($1)", [demoEmails]);
  await db.query("UPDATE schools SET deleted_at = CURRENT_TIMESTAMP WHERE email = $1", ["school@genidoc.local"]);
  console.log("Demo accounts and pilot demo school removed.");
}

main()
  .then(() => db.end())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
