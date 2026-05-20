const crypto = require("crypto");
const db = require("../config/database");
const SchoolStudent = require("./SchoolStudent");

function createToken() {
  return crypto.randomBytes(24).toString("base64url");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function emergencyUrl(req, token) {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers.host || `localhost:${process.env.PORT || 5000}`;
  return `${protocol}://${host}/emergency.html?token=${encodeURIComponent(token)}`;
}

class EmergencyQr {
  static async create(studentId, schoolId, userId, req) {
    const student = await SchoolStudent.findByIdForSchool(studentId, schoolId);
    if (!student) return null;

    await db.query(
      `UPDATE qr_tokens
       SET revoked_at = NOW(), revoked_by = $3
       WHERE student_id = $1 AND school_id = $2 AND revoked_at IS NULL`,
      [studentId, schoolId, userId],
    );

    const token = createToken();
    const result = await db.query(
      `INSERT INTO qr_tokens (
        school_id, student_id, token_hash, token_preview, expires_at, created_by
      )
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 year', $5)
       RETURNING id, student_id, token_preview, expires_at, created_at`,
      [schoolId, studentId, hashToken(token), token.slice(-6), userId],
    );

    return {
      ...result.rows[0],
      emergency_url: emergencyUrl(req, token),
    };
  }

  static async getActive(studentId, schoolId) {
    const student = await SchoolStudent.findByIdForSchool(studentId, schoolId);
    if (!student) return null;

    const result = await db.query(
      `SELECT id, student_id, token_preview, expires_at, created_at, revoked_at
       FROM qr_tokens
       WHERE student_id = $1
         AND school_id = $2
         AND revoked_at IS NULL
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [studentId, schoolId],
    );
    return result.rows[0] || null;
  }

  static async revoke(studentId, schoolId, userId) {
    const result = await db.query(
      `UPDATE qr_tokens
       SET revoked_at = NOW(), revoked_by = $3
       WHERE student_id = $1
         AND school_id = $2
         AND revoked_at IS NULL
       RETURNING id, student_id, revoked_at`,
      [studentId, schoolId, userId],
    );
    return result.rows[0] || null;
  }

  static async resolve(token, req) {
    const tokenHash = hashToken(token);
    const tokenResult = await db.query(
      `SELECT id, school_id, student_id, expires_at, revoked_at
       FROM qr_tokens
       WHERE token_hash = $1
       LIMIT 1`,
      [tokenHash],
    );
    const qr = tokenResult.rows[0];

    if (!qr || qr.revoked_at || new Date(qr.expires_at) <= new Date()) {
      await this.logScan(qr?.id || null, null, req, "denied");
      return null;
    }

    const result = await db.query(
      `SELECT s.id, s.first_name, s.last_name, s.date_of_birth, c.name AS class_name,
              sc.name AS school_name,
              hp.blood_type, hp.regular_treatment, hp.medical_diet,
              hp.emergency_protocol, hp.treating_doctor_name,
              hp.treating_doctor_phone, hp.critical_notes
       FROM students s
       INNER JOIN schools sc ON sc.id = s.school_id
       LEFT JOIN classes c ON c.id = s.class_id
       LEFT JOIN health_profiles hp ON hp.student_id = s.id
       WHERE s.id = $1 AND s.school_id = $2 AND s.deleted_at IS NULL
       LIMIT 1`,
      [qr.student_id, qr.school_id],
    );
    const student = result.rows[0];
    if (!student) {
      await this.logScan(qr.id, qr.student_id, req, "denied");
      return null;
    }

    const allergies = await db.query(
      `SELECT allergen, severity, reaction
       FROM allergies
       WHERE student_id = $1
       ORDER BY severity DESC, allergen`,
      [qr.student_id],
    );

    const conditions = await db.query(
      `SELECT condition_name, severity, notes
       FROM health_conditions
       WHERE student_id = $1
       ORDER BY severity DESC, condition_name`,
      [qr.student_id],
    );

    const medications = await db.query(
      `SELECT medication_name, dosage, frequency
       FROM medications
       WHERE student_id = $1
       ORDER BY medication_name`,
      [qr.student_id],
    );

    const contacts = await db.query(
      `SELECT name, relationship, phone, priority
       FROM emergency_contacts
       WHERE student_id = $1
       ORDER BY priority, name`,
      [qr.student_id],
    );

    await this.logScan(qr.id, qr.student_id, req, "allowed");

    return {
      student,
      allergies: allergies.rows,
      conditions: conditions.rows,
      medications: medications.rows,
      emergency_contacts: contacts.rows,
    };
  }

  static async logScan(qrTokenId, studentId, req, status) {
    await db.query(
      `INSERT INTO qr_scan_events (
        qr_token_id, student_id, status, ip_address, user_agent
      )
       VALUES ($1, $2, $3, $4, $5)`,
      [
        qrTokenId,
        studentId,
        status,
        req.ip || req.socket?.remoteAddress || null,
        req.headers["user-agent"] || null,
      ],
    );
  }
}

module.exports = EmergencyQr;
