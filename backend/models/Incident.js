const db = require("../config/database");
const SchoolStudent = require("./SchoolStudent");

class Incident {
  static async listBySchool(schoolId, filters = {}) {
    const values = [schoolId];
    const where = ["i.school_id = $1", "i.deleted_at IS NULL"];

    if (filters.status) {
      values.push(filters.status);
      where.push(`i.status = $${values.length}`);
    }

    if (filters.student_id) {
      values.push(filters.student_id);
      where.push(`i.student_id = $${values.length}`);
    }

    const result = await db.query(
      `SELECT i.id, i.student_id, i.title, i.incident_type, i.severity,
              i.status, i.occurred_at, i.location, i.created_at,
              s.first_name, s.last_name, c.name AS class_name
       FROM incidents i
       INNER JOIN students s ON s.id = i.student_id
       LEFT JOIN classes c ON c.id = s.class_id
       WHERE ${where.join(" AND ")}
       ORDER BY i.occurred_at DESC, i.created_at DESC`,
      values,
    );
    return result.rows;
  }

  static async findByIdForSchool(incidentId, schoolId) {
    const result = await db.query(
      `SELECT i.id, i.school_id, i.student_id, i.title, i.description,
              i.incident_type, i.severity, i.status, i.occurred_at,
              i.location, i.parent_notified_at, i.resolved_at, i.created_at,
              s.first_name, s.last_name, c.name AS class_name
       FROM incidents i
       INNER JOIN students s ON s.id = i.student_id
       LEFT JOIN classes c ON c.id = s.class_id
       WHERE i.id = $1 AND i.school_id = $2 AND i.deleted_at IS NULL
       LIMIT 1`,
      [incidentId, schoolId],
    );
    return result.rows[0] || null;
  }

  static async create(studentId, schoolId, data, userId) {
    const student = await SchoolStudent.findByIdForSchool(studentId, schoolId);
    if (!student) return null;

    const {
      title,
      description,
      incident_type,
      severity,
      occurred_at,
      location,
      action_taken,
      parent_notified,
    } = data;

    const result = await db.query(
      `INSERT INTO incidents (
        school_id, student_id, title, description, incident_type,
        severity, occurred_at, location, status, parent_notified_at, created_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, NOW()), $8, 'open',
               CASE WHEN $9 THEN NOW() ELSE NULL END, $10)
       RETURNING id, school_id, student_id, title, description, incident_type,
                 severity, status, occurred_at, location, parent_notified_at, created_at`,
      [
        schoolId,
        studentId,
        title,
        description || null,
        incident_type || "autre",
        severity || "faible",
        occurred_at || null,
        location || null,
        Boolean(parent_notified),
        userId,
      ],
    );

    if (action_taken) {
      await this.addAction(result.rows[0].id, schoolId, {
        action_type: "initial_action",
        description: action_taken,
      }, userId);
    }

    return result.rows[0];
  }

  static async update(incidentId, schoolId, data, userId) {
    const {
      title,
      description,
      incident_type,
      severity,
      status,
      location,
      parent_notified,
    } = data;

    const result = await db.query(
      `UPDATE incidents
       SET title = COALESCE($3, title),
           description = COALESCE($4, description),
           incident_type = COALESCE($5, incident_type),
           severity = COALESCE($6, severity),
           status = COALESCE($7, status),
           location = COALESCE($8, location),
           parent_notified_at = CASE
             WHEN $9::boolean IS TRUE AND parent_notified_at IS NULL THEN NOW()
             WHEN $9::boolean IS FALSE THEN NULL
             ELSE parent_notified_at
           END,
           resolved_at = CASE WHEN $7 = 'resolved' THEN NOW() ELSE resolved_at END,
           updated_at = NOW(),
           updated_by = $10
       WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL
       RETURNING id, school_id, student_id, title, description, incident_type,
                 severity, status, occurred_at, location, parent_notified_at, resolved_at`,
      [
        incidentId,
        schoolId,
        title || null,
        description || null,
        incident_type || null,
        severity || null,
        status || null,
        location || null,
        typeof parent_notified === "boolean" ? parent_notified : null,
        userId,
      ],
    );
    return result.rows[0] || null;
  }

  static async getActions(incidentId, schoolId) {
    const incident = await this.findByIdForSchool(incidentId, schoolId);
    if (!incident) return null;

    const result = await db.query(
      `SELECT ia.id, ia.action_type, ia.description, ia.created_at,
              u.first_name, u.last_name
       FROM incident_actions ia
       LEFT JOIN users u ON u.id = ia.created_by
       WHERE ia.incident_id = $1
       ORDER BY ia.created_at DESC`,
      [incidentId],
    );
    return result.rows;
  }

  static async addAction(incidentId, schoolId, data, userId) {
    const incident = await this.findByIdForSchool(incidentId, schoolId);
    if (!incident) return null;

    const result = await db.query(
      `INSERT INTO incident_actions (
        incident_id, action_type, description, created_by
      )
       VALUES ($1, $2, $3, $4)
       RETURNING id, incident_id, action_type, description, created_at`,
      [
        incidentId,
        data.action_type || "note",
        data.description,
        userId,
      ],
    );
    return result.rows[0];
  }
}

module.exports = Incident;
