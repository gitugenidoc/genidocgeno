const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../config/database");

function createOpaqueToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

class AccountSecurity {
  static async queueEmail({ to, subject, body }) {
    await db.query(
      `INSERT INTO email_outbox (recipient_email, subject, body)
       VALUES ($1, $2, $3)`,
      [to.toLowerCase(), subject, body],
    );
  }

  static async createPasswordReset(email) {
    const userResult = await db.query(
      "SELECT id, email FROM users WHERE LOWER(email) = LOWER($1) AND status = 'active' LIMIT 1",
      [email],
    );
    const user = userResult.rows[0];
    if (!user) return null;

    const token = createOpaqueToken();
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
      [user.id, hashToken(token)],
    );

    const baseUrl = process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL;
    await this.queueEmail({
      to: user.email,
      subject: "Reinitialisation de votre mot de passe GeniDoc Hayat",
      body: `Ouvrez ce lien pour definir un nouveau mot de passe: ${baseUrl}/app/auth/reset-password.html?token=${token}`,
    });
    return true;
  }

  static async resetPassword(token, password) {
    if (!token || !password || password.length < 12) return false;
    const result = await db.query(
      `SELECT prt.id, prt.user_id
       FROM password_reset_tokens prt
       WHERE prt.token_hash = $1
         AND prt.used_at IS NULL
         AND prt.expires_at > NOW()
       LIMIT 1`,
      [hashToken(token)],
    );
    const reset = result.rows[0];
    if (!reset) return false;

    const passwordHash = await bcrypt.hash(password, 10);
    await db.query("UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
      passwordHash,
      reset.user_id,
    ]);
    await db.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1", [reset.id]);
    await db.query("UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL", [
      reset.user_id,
    ]);
    return true;
  }

  static async createInvitation({ schoolId, email, roleCode, firstName, lastName, createdBy }) {
    const token = createOpaqueToken();
    await db.query(
      `INSERT INTO account_invitations (
        school_id, email, role_code, first_name, last_name, token_hash, expires_at, created_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '7 days', $7)`,
      [schoolId, email.toLowerCase(), roleCode, firstName, lastName, hashToken(token), createdBy],
    );

    const baseUrl = process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL;
    await this.queueEmail({
      to: email,
      subject: "Invitation GeniDoc Hayat",
      body: `Ouvrez ce lien pour activer votre compte: ${baseUrl}/app/auth/accept-invitation.html?token=${token}`,
    });
    return true;
  }

  static async acceptInvitation(token, password) {
    if (!token || !password || password.length < 12) return null;
    const result = await db.query(
      `SELECT * FROM account_invitations
       WHERE token_hash = $1 AND accepted_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [hashToken(token)],
    );
    const invitation = result.rows[0];
    if (!invitation) return null;

    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await db.query(
      `INSERT INTO users (school_id, email, password_hash, first_name, last_name, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           school_id = EXCLUDED.school_id,
           status = 'active',
           updated_at = CURRENT_TIMESTAMP
       RETURNING id, email`,
      [
        invitation.school_id,
        invitation.email,
        passwordHash,
        invitation.first_name,
        invitation.last_name,
      ],
    );
    await db.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE code = $2
       ON CONFLICT DO NOTHING`,
      [userResult.rows[0].id, invitation.role_code],
    );
    await db.query("UPDATE account_invitations SET accepted_at = NOW() WHERE id = $1", [invitation.id]);
    return userResult.rows[0];
  }
}

module.exports = AccountSecurity;
