require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../config/database");

async function main() {
  const email = process.env.PLATFORM_OWNER_EMAIL || process.env.GENIDOC_ADMIN_EMAIL;
  const password = process.env.PLATFORM_OWNER_PASSWORD || process.env.GENIDOC_ADMIN_PASSWORD;
  const firstName = process.env.PLATFORM_OWNER_FIRST_NAME || "SENHAJI";
  const lastName = process.env.PLATFORM_OWNER_LAST_NAME || "Anas";

  if (!email || !password) {
    throw new Error("PLATFORM_OWNER_EMAIL and PLATFORM_OWNER_PASSWORD are required");
  }

  if (password.length < 12) {
    throw new Error("PLATFORM_OWNER_PASSWORD must contain at least 12 characters");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await db.query(
    `INSERT INTO users (school_id, email, password_hash, first_name, last_name, status)
     VALUES (NULL, $1, $2, $3, $4, 'active')
     ON CONFLICT (email) DO UPDATE
     SET password_hash = EXCLUDED.password_hash,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         school_id = NULL,
         status = 'active',
         updated_at = CURRENT_TIMESTAMP
     RETURNING id, email`,
    [email.toLowerCase(), passwordHash, firstName, lastName],
  );

  await db.query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT $1, id FROM roles WHERE code = 'PLATFORM_OWNER'
     ON CONFLICT DO NOTHING`,
    [result.rows[0].id],
  );

  console.log(`Official platform owner ready: ${result.rows[0].email}`);
}

main()
  .then(() => db.end())
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
