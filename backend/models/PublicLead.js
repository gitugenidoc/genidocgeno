const db = require("../config/database");

class PublicLead {
  static async createContact(data) {
    const { name, email, phone, organization, message } = data;
    const result = await db.query(
      `INSERT INTO contact_messages (name, email, phone, organization, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, organization, message, status, created_at`,
      [name, email, phone, organization, message],
    );
    return result.rows[0];
  }

  static async createDemoRequest(data) {
    const {
      school_name,
      contact_name,
      email,
      phone,
      city,
      students_count,
      message,
    } = data;
    const result = await db.query(
      `INSERT INTO demo_requests (
        school_name, contact_name, email, phone, city, students_count, message
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, school_name, contact_name, email, phone, city, students_count, message, status, created_at`,
      [school_name, contact_name, email, phone, city, students_count, message],
    );
    return result.rows[0];
  }
}

module.exports = PublicLead;
