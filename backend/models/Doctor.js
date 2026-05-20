const db = require("../config/database");

class Doctor {
  static async create(data) {
    const {
      hospital_id,
      name,
      specialty,
      email,
      password_hash,
      phone,
      years_experience,
      clinic_name,
      clinic_address,
      clinic_city,
      clinic_phone,
    } = data;
    const result = await db.query(
      `INSERT INTO doctors (
        hospital_id, name, specialty, email, password_hash, phone, years_experience,
        clinic_name, clinic_address, clinic_city, clinic_phone
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, hospital_id, name, specialty, email, phone, years_experience,
         clinic_name, clinic_address, clinic_city, clinic_phone, appointment_duration, created_at`,
      [
        hospital_id,
        name,
        specialty,
        email,
        password_hash,
        phone,
        years_experience,
        clinic_name,
        clinic_address,
        clinic_city,
        clinic_phone,
      ],
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT id, hospital_id, name, specialty, email, phone, bio, years_experience,
        appointment_duration, clinic_name, clinic_address, clinic_city, clinic_phone, created_at
       FROM doctors WHERE id = $1`,
      [id],
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query("SELECT * FROM doctors WHERE email = $1", [
      email,
    ]);
    return result.rows[0];
  }

  static async getByHospital(hospital_id) {
    const result = await db.query(
      `SELECT id, name, specialty, phone, email, years_experience,
        clinic_name, clinic_address, clinic_city, clinic_phone
       FROM doctors WHERE hospital_id = $1 ORDER BY name`,
      [hospital_id],
    );
    return result.rows;
  }

  static async getAvailability(doctor_id) {
    const result = await db.query(
      "SELECT * FROM doctor_availability WHERE doctor_id = $1",
      [doctor_id],
    );
    return result.rows;
  }

  static async getAll() {
    const result = await db.query(
      `SELECT id, name, specialty, phone, email, clinic_name, clinic_city
       FROM doctors ORDER BY name`,
    );
    return result.rows;
  }

  static async updateProfile(id, data) {
    const {
      name,
      specialty,
      phone,
      years_experience,
      clinic_name,
      clinic_address,
      clinic_city,
      clinic_phone,
      bio,
    } = data;
    const result = await db.query(
      `UPDATE doctors
       SET name = $1, specialty = $2, phone = $3, years_experience = $4,
           clinic_name = $5, clinic_address = $6, clinic_city = $7,
           clinic_phone = $8, bio = $9
       WHERE id = $10
       RETURNING id, hospital_id, name, specialty, email, phone, bio, years_experience,
         appointment_duration, clinic_name, clinic_address, clinic_city, clinic_phone, created_at`,
      [
        name,
        specialty,
        phone,
        years_experience,
        clinic_name,
        clinic_address,
        clinic_city,
        clinic_phone,
        bio,
        id,
      ],
    );
    return result.rows[0];
  }

  static async getPrivateClinics() {
    const result = await db.query(
      `SELECT id, name, address, city, phone, website, source_url
       FROM private_pediatric_clinics
       ORDER BY city, name`,
    );
    return result.rows;
  }
}

module.exports = Doctor;
