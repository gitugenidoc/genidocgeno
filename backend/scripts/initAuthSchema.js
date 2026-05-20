require("dotenv").config();
const db = require("../config/database");

const roles = [
  ["SCHOOL_ADMIN", "Administrateur ecole"],
  ["SCHOOL_NURSE", "Infirmerie scolaire"],
  ["PARENT", "Parent"],
  ["PEDIATRICIAN", "Pediatre partenaire"],
  ["GENIDOC_ADMIN", "Admin GeniDoc"],
  ["PLATFORM_OWNER", "Proprietaire plateforme"],
];

const permissions = [
  ["school:manage", "Gerer l'ecole et les utilisateurs"],
  ["students:read", "Voir les eleves"],
  ["students:write", "Creer et modifier les eleves"],
  ["health:read", "Voir les fiches sante"],
  ["health:write", "Modifier les fiches sante"],
  ["documents:read", "Voir les documents"],
  ["documents:write", "Ajouter des documents"],
  ["incidents:read", "Voir les incidents"],
  ["incidents:write", "Creer et modifier les incidents"],
  ["audit:read", "Voir les journaux d'audit"],
  ["admin:manage", "Administration globale GeniDoc"],
];

const rolePermissions = {
  SCHOOL_ADMIN: [
    "school:manage",
    "students:read",
    "students:write",
    "health:read",
    "documents:read",
    "incidents:read",
  ],
  SCHOOL_NURSE: [
    "students:read",
    "health:read",
    "health:write",
    "documents:read",
    "incidents:read",
    "incidents:write",
  ],
  PARENT: ["students:read", "health:read", "health:write", "documents:read", "documents:write"],
  PEDIATRICIAN: ["health:read", "documents:read", "incidents:read"],
  GENIDOC_ADMIN: ["admin:manage"],
  PLATFORM_OWNER: ["admin:manage", "audit:read"],
};

async function main() {
  await db.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS schools (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      city VARCHAR(100),
      address TEXT,
      phone VARCHAR(30),
      email VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      school_id INTEGER REFERENCES schools(id),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      code VARCHAR(80) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, role_id)
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (role_id, permission_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(64) NOT NULL UNIQUE,
      user_agent TEXT,
      ip_address TEXT,
      expires_at TIMESTAMP NOT NULL,
      revoked_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(64) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
    CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
  `);

  for (const [code, name] of roles) {
    await db.query(
      `INSERT INTO roles (code, name)
       VALUES ($1, $2)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`,
      [code, name],
    );
  }

  for (const [code, description] of permissions) {
    await db.query(
      `INSERT INTO permissions (code, description)
       VALUES ($1, $2)
       ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description`,
      [code, description],
    );
  }

  await db.query(
    `DELETE FROM role_permissions
     WHERE role_id IN (SELECT id FROM roles WHERE code = ANY($1))`,
    [Object.keys(rolePermissions)],
  );

  for (const [roleCode, permissionCodes] of Object.entries(rolePermissions)) {
    for (const permissionCode of permissionCodes) {
      await db.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         SELECT r.id, p.id
         FROM roles r, permissions p
         WHERE r.code = $1 AND p.code = $2
         ON CONFLICT DO NOTHING`,
        [roleCode, permissionCode],
      );
    }
  }

  console.log("Auth schema ready. Run npm run bootstrap:admin to create the first official admin.");
}

main()
  .then(() => db.end())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
