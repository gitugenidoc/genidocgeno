const db = require("../config/database");
const bcrypt = require("bcryptjs");

class School {
  static async listAll() {
    const result = await db.query(
      `SELECT s.id, s.name, s.city, s.address, s.phone, s.email, s.created_at,
              COUNT(DISTINCT c.id)::int AS classes_count,
              COUNT(DISTINCT st.id)::int AS students_count,
              COUNT(DISTINCT u.id)::int AS users_count
       FROM schools s
       LEFT JOIN classes c ON c.school_id = s.id AND c.deleted_at IS NULL
       LEFT JOIN students st ON st.school_id = s.id AND st.deleted_at IS NULL
       LEFT JOIN users u ON u.school_id = s.id AND u.deleted_at IS NULL
       WHERE s.deleted_at IS NULL
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
    );
    return result.rows;
  }

  static async getById(id) {
    const result = await db.query(
      `SELECT id, name, city, address, phone, email, created_at, updated_at
       FROM schools
       WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    return result.rows[0] || null;
  }

  static async getDashboardStats(schoolId) {
    const result = await db.query(
      `SELECT
        (SELECT COUNT(*)::int FROM classes WHERE school_id = $1 AND deleted_at IS NULL) AS classes_count,
        (SELECT COUNT(*)::int FROM students WHERE school_id = $1 AND deleted_at IS NULL) AS students_count,
        (SELECT COUNT(*)::int FROM guardians g
          INNER JOIN student_guardian_links sgl ON sgl.guardian_id = g.id
          INNER JOIN students s ON s.id = sgl.student_id
          WHERE s.school_id = $1 AND s.deleted_at IS NULL) AS guardians_count,
        (SELECT COUNT(*)::int FROM emergency_contacts ec
          INNER JOIN students s ON s.id = ec.student_id
          WHERE s.school_id = $1 AND s.deleted_at IS NULL) AS emergency_contacts_count`,
      [schoolId],
    );
    return result.rows[0];
  }

  static async getClasses(schoolId) {
    const result = await db.query(
      `SELECT c.id, c.name, c.level, c.academic_year, c.created_at,
              COUNT(s.id)::int AS students_count
       FROM classes c
       LEFT JOIN students s ON s.class_id = c.id AND s.deleted_at IS NULL
       WHERE c.school_id = $1 AND c.deleted_at IS NULL
       GROUP BY c.id
       ORDER BY c.name`,
      [schoolId],
    );
    return result.rows;
  }

  static async createClass(schoolId, data, userId) {
    const { name, level, academic_year } = data;
    const result = await db.query(
      `INSERT INTO classes (school_id, name, level, academic_year, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, school_id, name, level, academic_year, created_at`,
      [schoolId, name, level || null, academic_year || null, userId],
    );
    return result.rows[0];
  }

  static async createSchool(data) {
    const { name, city, address, phone, email } = data;
    const result = await db.query(
      `INSERT INTO schools (name, city, address, phone, email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, city, address, phone, email, created_at`,
      [
        name,
        city || null,
        address || null,
        phone || null,
        email ? email.toLowerCase() : null,
      ],
    );
    return result.rows[0];
  }

  static async createSchoolAdmin({ schoolId, email, firstName, lastName, password }) {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (school_id, email, password_hash, first_name, last_name, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id, school_id, email, first_name, last_name, status, created_at`,
      [schoolId, email.toLowerCase(), passwordHash, firstName, lastName],
    );

    await db.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE code = 'SCHOOL_ADMIN'
       ON CONFLICT DO NOTHING`,
      [result.rows[0].id],
    );

    return result.rows[0];
  }
}

module.exports = School;
