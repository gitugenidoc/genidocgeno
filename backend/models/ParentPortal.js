const db = require("../config/database");
const HealthProfile = require("./HealthProfile");

class ParentPortal {
  static async getChildrenForUser(user) {
    const result = await db.query(
      `SELECT DISTINCT s.id, s.school_id, s.identifier, s.first_name, s.last_name,
              s.date_of_birth, s.gender, c.name AS class_name, sc.name AS school_name,
              g.phone AS guardian_phone, sgl.relationship
       FROM students s
       INNER JOIN student_guardian_links sgl ON sgl.student_id = s.id
       INNER JOIN guardians g ON g.id = sgl.guardian_id
       INNER JOIN schools sc ON sc.id = s.school_id
       LEFT JOIN classes c ON c.id = s.class_id
       WHERE s.deleted_at IS NULL
         AND g.deleted_at IS NULL
         AND (LOWER(g.email) = LOWER($1) OR g.user_id = $2)
       ORDER BY s.last_name, s.first_name`,
      [user.email, user.id],
    );
    return result.rows;
  }

  static async getChildForUser(studentId, user) {
    const result = await db.query(
      `SELECT DISTINCT s.id, s.school_id, s.identifier, s.first_name, s.last_name,
              s.date_of_birth, s.gender, c.name AS class_name, sc.name AS school_name,
              g.phone AS guardian_phone, sgl.relationship
       FROM students s
       INNER JOIN student_guardian_links sgl ON sgl.student_id = s.id
       INNER JOIN guardians g ON g.id = sgl.guardian_id
       INNER JOIN schools sc ON sc.id = s.school_id
       LEFT JOIN classes c ON c.id = s.class_id
       WHERE s.id = $1
         AND s.deleted_at IS NULL
         AND g.deleted_at IS NULL
         AND (LOWER(g.email) = LOWER($2) OR g.user_id = $3)
       LIMIT 1`,
      [studentId, user.email, user.id],
    );
    return result.rows[0] || null;
  }

  static async getHealthProfile(studentId, user) {
    const child = await this.getChildForUser(studentId, user);
    if (!child) return null;
    const health = await HealthProfile.get(studentId, child.school_id);
    return { child, ...health };
  }

  static async updateHealthProfile(studentId, user, data) {
    const child = await this.getChildForUser(studentId, user);
    if (!child) return null;
    const health = await HealthProfile.upsert(studentId, child.school_id, data, user.id);
    return { child, ...health };
  }

  static async getAuthorizations(studentId, user) {
    const child = await this.getChildForUser(studentId, user);
    if (!child) return null;

    const result = await db.query(
      `SELECT id, student_id, emergency_care_authorized, medication_authorized,
              school_trip_authorized, medical_info_sharing_authorized,
              notes, updated_at
       FROM parent_authorizations
       WHERE student_id = $1
       LIMIT 1`,
      [studentId],
    );
    return { child, authorizations: result.rows[0] || null };
  }

  static async updateAuthorizations(studentId, user, data) {
    const child = await this.getChildForUser(studentId, user);
    if (!child) return null;

    const result = await db.query(
      `INSERT INTO parent_authorizations (
        student_id, school_id, guardian_user_id, emergency_care_authorized,
        medication_authorized, school_trip_authorized,
        medical_info_sharing_authorized, notes, updated_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $3)
       ON CONFLICT (student_id, guardian_user_id)
       DO UPDATE SET emergency_care_authorized = EXCLUDED.emergency_care_authorized,
                     medication_authorized = EXCLUDED.medication_authorized,
                     school_trip_authorized = EXCLUDED.school_trip_authorized,
                     medical_info_sharing_authorized = EXCLUDED.medical_info_sharing_authorized,
                     notes = EXCLUDED.notes,
                     updated_at = NOW(),
                     updated_by = EXCLUDED.updated_by
       RETURNING id, student_id, emergency_care_authorized, medication_authorized,
                 school_trip_authorized, medical_info_sharing_authorized,
                 notes, updated_at`,
      [
        studentId,
        child.school_id,
        user.id,
        Boolean(data.emergency_care_authorized),
        Boolean(data.medication_authorized),
        Boolean(data.school_trip_authorized),
        Boolean(data.medical_info_sharing_authorized),
        data.notes || null,
      ],
    );

    return { child, authorizations: result.rows[0] };
  }
}

module.exports = ParentPortal;
