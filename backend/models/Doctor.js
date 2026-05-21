const db = require("../config/database");
const casablancaPediatricProviders = require("../data/casablancaPediatricProviders");

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

  static async getPrivateClinics(filters = {}) {
    const limit = Math.min(Number(filters.limit) || 200, 200);
    const city = (filters.city || "Casablanca").toLowerCase();
    const category = filters.category || null;

    try {
      const values = [city, limit];
      const where = ["LOWER(city) = $1"];

      if (category) {
        values.splice(1, 0, category);
        where.push("category = $2");
      }

      const result = await db.query(
        `SELECT id, name, category, specialties, address, city, district, phone, website, source_url
         FROM private_pediatric_clinics
         WHERE ${where.join(" AND ")}
         ORDER BY
           CASE category
             WHEN 'cabinet_pediatrique' THEN 1
             WHEN 'clinique_pediatrique' THEN 2
             WHEN 'maternite_mere_enfant' THEN 3
             ELSE 4
           END,
           name
         LIMIT $${values.length}`,
        values,
      );
      if (result.rows.length) return result.rows;
    } catch (error) {
      const canUseSeedFallback = ["42P01", "42703", "ECONNREFUSED", "3D000"].includes(error.code);
      if (!canUseSeedFallback) {
        throw error;
      }
    }

    return casablancaPediatricProviders
      .filter((provider) => provider.city.toLowerCase() === city)
      .filter((provider) => !category || provider.category === category)
      .sort((a, b) => {
        const order = {
          cabinet_pediatrique: 1,
          clinique_pediatrique: 2,
          maternite_mere_enfant: 3,
        };
        return (order[a.category] || 4) - (order[b.category] || 4) || a.name.localeCompare(b.name);
      })
      .slice(0, limit);
  }
}

module.exports = Doctor;
