const db = require("../config/database");

class Audit {
  static async log({
    req,
    action,
    status = "success",
    schoolId = null,
    userId = null,
    studentId = null,
    entityType = null,
    entityId = null,
    metadata = {},
  }) {
    try {
      await db.query(
        `INSERT INTO audit_events (
          school_id, user_id, student_id, action, status,
          entity_type, entity_id, ip_address, user_agent, metadata
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          schoolId || req?.currentUser?.school_id || null,
          userId || req?.currentUser?.id || null,
          studentId || null,
          action,
          status,
          entityType || null,
          entityId || null,
          req?.ip || req?.socket?.remoteAddress || null,
          req?.headers?.["user-agent"] || null,
          metadata,
        ],
      );
    } catch (error) {
      console.error("Erreur audit:", error);
    }
  }

  static async listForUser(user, filters = {}) {
    const values = [];
    const where = [];

    if (!user.roles.includes("PLATFORM_OWNER")) {
      return [];
    }

    if (filters.action) {
      values.push(filters.action);
      where.push(`ae.action = $${values.length}`);
    }

    if (filters.student_id) {
      values.push(filters.student_id);
      where.push(`ae.student_id = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await db.query(
      `SELECT ae.id, ae.school_id, ae.user_id, ae.student_id, ae.action,
              ae.status, ae.entity_type, ae.entity_id, ae.ip_address,
              ae.created_at, ae.metadata,
              u.email AS user_email, u.first_name AS user_first_name,
              u.last_name AS user_last_name,
              s.first_name AS student_first_name, s.last_name AS student_last_name,
              sc.name AS school_name
       FROM audit_events ae
       LEFT JOIN users u ON u.id = ae.user_id
       LEFT JOIN students s ON s.id = ae.student_id
       LEFT JOIN schools sc ON sc.id = ae.school_id
       ${whereSql}
       ORDER BY ae.created_at DESC
       LIMIT 200`,
      values,
    );
    return result.rows;
  }
}

module.exports = Audit;
