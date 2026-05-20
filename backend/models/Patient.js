const db = require("../config/database");

class Patient {
  static async create(data) {
    const {
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      date_of_birth,
      hospital_id,
    } = data;
    const result = await db.query(
      `INSERT INTO patients (hospital_id, email, password_hash, first_name, last_name, phone, date_of_birth)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        hospital_id,
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        date_of_birth,
      ],
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query("SELECT * FROM patients WHERE email = $1", [
      email,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query("SELECT * FROM patients WHERE id = $1", [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const {
      first_name,
      last_name,
      phone,
      date_of_birth,
      gender,
      blood_type,
      allergies,
      chronic_diseases,
      emergency_contact_name,
      emergency_contact_phone,
    } = data;
    const result = await db.query(
      `UPDATE patients 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           date_of_birth = COALESCE($4, date_of_birth),
           gender = COALESCE($5, gender),
           blood_type = COALESCE($6, blood_type),
           allergies = COALESCE($7, allergies),
           chronic_diseases = COALESCE($8, chronic_diseases),
           emergency_contact_name = COALESCE($9, emergency_contact_name),
           emergency_contact_phone = COALESCE($10, emergency_contact_phone),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        first_name || null,
        last_name || null,
        phone || null,
        date_of_birth || null,
        gender || null,
        blood_type || null,
        allergies || null,
        chronic_diseases || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        id,
      ],
    );
    return result.rows[0];
  }

  static async getAll(hospital_id) {
    const result = await db.query(
      "SELECT id, first_name, last_name, email, phone, date_of_birth, created_at FROM patients WHERE hospital_id = $1 ORDER BY created_at DESC",
      [hospital_id],
    );
    return result.rows;
  }
}

module.exports = Patient;
