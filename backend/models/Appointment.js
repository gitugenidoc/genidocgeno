const db = require("../config/database");

class Appointment {
  static async create(data) {
    const {
      patient_id,
      doctor_id,
      hospital_id,
      appointment_date,
      appointment_time,
      reason,
      duration,
    } = data;
    const result = await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, hospital_id, appointment_date, appointment_time, reason, duration, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [
        patient_id,
        doctor_id,
        hospital_id,
        appointment_date,
        appointment_time,
        reason,
        duration || 30,
      ],
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT a.*, d.name as doctor_name, d.specialty, p.first_name, p.last_name, p.email
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN patients p ON a.patient_id = p.id
       WHERE a.id = $1`,
      [id],
    );
    return result.rows[0];
  }

  static async getByPatient(patient_id) {
    const result = await db.query(
      `SELECT a.*, d.name as doctor_name, d.specialty, d.phone as doctor_phone
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.patient_id = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [patient_id],
    );
    return result.rows;
  }

  static async getByDoctor(doctor_id) {
    const result = await db.query(
      `SELECT a.*, p.first_name, p.last_name, p.email, p.phone
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       WHERE a.doctor_id = $1
       ORDER BY a.appointment_date ASC, a.appointment_time ASC`,
      [doctor_id],
    );
    return result.rows;
  }

  static async getAvailable(hospital_id, appointment_date) {
    const result = await db.query(
      `SELECT a.id, a.appointment_time, d.id as doctor_id, d.name as doctor_name, d.specialty
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.hospital_id = $1 
         AND a.appointment_date = $2
         AND a.status = 'pending'
       ORDER BY d.name, a.appointment_time`,
      [hospital_id, appointment_date],
    );
    return result.rows;
  }

  static async updateStatus(id, status, notes = null) {
    const result = await db.query(
      `UPDATE appointments 
       SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, notes, id],
    );
    return result.rows[0];
  }

  static async cancel(id) {
    return this.updateStatus(id, "cancelled");
  }
}

module.exports = Appointment;
