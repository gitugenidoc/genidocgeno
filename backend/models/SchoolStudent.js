const db = require("../config/database");

class SchoolStudent {
  static async listBySchool(schoolId, filters = {}) {
    const values = [schoolId];
    const where = ["s.school_id = $1", "s.deleted_at IS NULL"];

    if (filters.class_id) {
      values.push(filters.class_id);
      where.push(`s.class_id = $${values.length}`);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      where.push(
        `(s.first_name ILIKE $${values.length}
          OR s.last_name ILIKE $${values.length}
          OR s.identifier ILIKE $${values.length})`,
      );
    }

    const result = await db.query(
      `SELECT s.id, s.identifier, s.first_name, s.last_name, s.date_of_birth,
              s.gender, s.status, s.created_at, c.name AS class_name,
              COUNT(DISTINCT ec.id)::int AS emergency_contacts_count,
              COUNT(DISTINCT sgl.guardian_id)::int AS guardians_count
       FROM students s
       LEFT JOIN classes c ON c.id = s.class_id
       LEFT JOIN emergency_contacts ec ON ec.student_id = s.id
       LEFT JOIN student_guardian_links sgl ON sgl.student_id = s.id
       WHERE ${where.join(" AND ")}
       GROUP BY s.id, c.name
       ORDER BY s.last_name, s.first_name`,
      values,
    );
    return result.rows;
  }

  static async findByIdForSchool(studentId, schoolId) {
    const result = await db.query(
      `SELECT s.id, s.school_id, s.class_id, s.identifier, s.first_name,
              s.last_name, s.date_of_birth, s.gender, s.status, s.notes,
              c.name AS class_name, c.level AS class_level
       FROM students s
       LEFT JOIN classes c ON c.id = s.class_id
       WHERE s.id = $1 AND s.school_id = $2 AND s.deleted_at IS NULL
       LIMIT 1`,
      [studentId, schoolId],
    );
    return result.rows[0] || null;
  }

  static async create(schoolId, data, userId) {
    const {
      class_id,
      identifier,
      first_name,
      last_name,
      date_of_birth,
      gender,
      notes,
    } = data;
    const result = await db.query(
      `INSERT INTO students (
        school_id, class_id, identifier, first_name, last_name,
        date_of_birth, gender, notes, created_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, school_id, class_id, identifier, first_name, last_name,
                 date_of_birth, gender, status, notes, created_at`,
      [
        schoolId,
        class_id || null,
        identifier || null,
        first_name,
        last_name,
        date_of_birth || null,
        gender || null,
        notes || null,
        userId,
      ],
    );
    return result.rows[0];
  }

  static async update(studentId, schoolId, data, userId) {
    const {
      class_id,
      identifier,
      first_name,
      last_name,
      date_of_birth,
      gender,
      status,
      notes,
    } = data;
    const result = await db.query(
      `UPDATE students
       SET class_id = COALESCE($3, class_id),
           identifier = COALESCE($4, identifier),
           first_name = COALESCE($5, first_name),
           last_name = COALESCE($6, last_name),
           date_of_birth = COALESCE($7, date_of_birth),
           gender = COALESCE($8, gender),
           status = COALESCE($9, status),
           notes = COALESCE($10, notes),
           updated_at = NOW(),
           updated_by = $11
       WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL
       RETURNING id, school_id, class_id, identifier, first_name, last_name,
                 date_of_birth, gender, status, notes, updated_at`,
      [
        studentId,
        schoolId,
        class_id || null,
        identifier || null,
        first_name || null,
        last_name || null,
        date_of_birth || null,
        gender || null,
        status || null,
        notes || null,
        userId,
      ],
    );
    return result.rows[0] || null;
  }

  static async getGuardians(studentId, schoolId) {
    const result = await db.query(
      `SELECT g.id, g.first_name, g.last_name, g.email, g.phone,
              sgl.relationship, sgl.is_primary
       FROM guardians g
       INNER JOIN student_guardian_links sgl ON sgl.guardian_id = g.id
       INNER JOIN students s ON s.id = sgl.student_id
       WHERE s.id = $1 AND s.school_id = $2 AND s.deleted_at IS NULL
       ORDER BY sgl.is_primary DESC, g.last_name, g.first_name`,
      [studentId, schoolId],
    );
    return result.rows;
  }

  static async addGuardian(studentId, schoolId, data, userId) {
    const student = await this.findByIdForSchool(studentId, schoolId);
    if (!student) return null;

    const {
      first_name,
      last_name,
      email,
      phone,
      relationship,
      is_primary,
    } = data;

    let guardianResult;
    let linkedUserId = null;
    if (email) {
      const userResult = await db.query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [email],
      );
      linkedUserId = userResult.rows[0]?.id || null;

      guardianResult = await db.query(
        `UPDATE guardians
         SET first_name = $3,
             last_name = $4,
             phone = $5,
             user_id = COALESCE($6, user_id),
             updated_at = NOW(),
             updated_by = $7
         WHERE school_id = $1 AND LOWER(email) = LOWER($2)
         RETURNING id, first_name, last_name, email, phone, user_id`,
        [schoolId, email, first_name, last_name, phone || null, linkedUserId, userId],
      );
    }

    if (!guardianResult || guardianResult.rowCount === 0) {
      guardianResult = await db.query(
        `INSERT INTO guardians (
          school_id, first_name, last_name, email, phone, user_id, created_by
        )
         VALUES (
          $1, $2, $3, $4, $5, $6, $7
         )
         RETURNING id, first_name, last_name, email, phone, user_id`,
        [schoolId, first_name, last_name, email || null, phone || null, linkedUserId, userId],
      );
    }

    await db.query(
      `INSERT INTO student_guardian_links (
        student_id, guardian_id, relationship, is_primary, created_by
      )
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_id, guardian_id)
       DO UPDATE SET relationship = EXCLUDED.relationship,
                     is_primary = EXCLUDED.is_primary`,
      [
        studentId,
        guardianResult.rows[0].id,
        relationship || "Parent",
        Boolean(is_primary),
        userId,
      ],
    );

    return guardianResult.rows[0];
  }

  static async getEmergencyContacts(studentId, schoolId) {
    const result = await db.query(
      `SELECT ec.id, ec.name, ec.relationship, ec.phone, ec.priority
       FROM emergency_contacts ec
       INNER JOIN students s ON s.id = ec.student_id
       WHERE s.id = $1 AND s.school_id = $2 AND s.deleted_at IS NULL
       ORDER BY ec.priority, ec.name`,
      [studentId, schoolId],
    );
    return result.rows;
  }

  static async addEmergencyContact(studentId, schoolId, data, userId) {
    const student = await this.findByIdForSchool(studentId, schoolId);
    if (!student) return null;

    const { name, relationship, phone, priority } = data;
    const result = await db.query(
      `INSERT INTO emergency_contacts (
        student_id, name, relationship, phone, priority, created_by
      )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, student_id, name, relationship, phone, priority`,
      [studentId, name, relationship || null, phone, priority || 1, userId],
    );
    return result.rows[0];
  }
}

module.exports = SchoolStudent;
