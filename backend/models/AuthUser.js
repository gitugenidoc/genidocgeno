const db = require("../config/database");

class AuthUser {
  static async findByEmail(email) {
    const result = await db.query(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.status,
              u.school_id, u.created_at
       FROM users u
       WHERE LOWER(u.email) = LOWER($1)
       LIMIT 1`,
      [email],
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.status,
              u.school_id, u.created_at
       FROM users u
       WHERE u.id = $1
       LIMIT 1`,
      [id],
    );
    return result.rows[0] || null;
  }

  static async getRoles(userId) {
    const result = await db.query(
      `SELECT r.code, r.name
       FROM roles r
       INNER JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1
       ORDER BY r.code`,
      [userId],
    );
    return result.rows;
  }

  static async getPermissions(userId) {
    const result = await db.query(
      `SELECT DISTINCT p.code, p.description
       FROM permissions p
       INNER JOIN role_permissions rp ON rp.permission_id = p.id
       INNER JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = $1
       ORDER BY p.code`,
      [userId],
    );
    return result.rows;
  }

  static async createSession({ userId, tokenHash, expiresAt, userAgent, ipAddress }) {
    const result = await db.query(
      `INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, expires_at, created_at`,
      [userId, tokenHash, expiresAt, userAgent, ipAddress],
    );
    return result.rows[0];
  }

  static async findActiveSession(tokenHash) {
    const result = await db.query(
      `SELECT id, user_id, expires_at, revoked_at
       FROM sessions
       WHERE token_hash = $1
         AND revoked_at IS NULL
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash],
    );
    return result.rows[0] || null;
  }

  static async revokeSession(tokenHash) {
    await db.query(
      `UPDATE sessions
       SET revoked_at = NOW()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash],
    );
  }
}

module.exports = AuthUser;
