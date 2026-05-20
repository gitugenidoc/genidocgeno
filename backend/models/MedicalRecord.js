const db = require("../config/database");

class MedicalRecord {
  static async create(data) {
    const {
      patient_id,
      doctor_id,
      hospital_id,
      appointment_id,
      visit_date,
      reason_for_visit,
      symptoms,
      diagnosis,
      treatment,
      medications,
    } = data;
    const result = await db.query(
      `INSERT INTO medical_records (patient_id, doctor_id, hospital_id, appointment_id, visit_date, reason_for_visit, symptoms, diagnosis, treatment, medications)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        patient_id,
        doctor_id,
        hospital_id,
        appointment_id,
        visit_date,
        reason_for_visit,
        symptoms,
        diagnosis,
        treatment,
        medications,
      ],
    );
    return result.rows[0];
  }

  static async getByPatient(patient_id) {
    const result = await db.query(
      `SELECT m.*, d.name as doctor_name, d.specialty
       FROM medical_records m
       JOIN doctors d ON m.doctor_id = d.id
       WHERE m.patient_id = $1
       ORDER BY m.visit_date DESC`,
      [patient_id],
    );
    return result.rows;
  }

  static async getById(id) {
    const result = await db.query(
      `SELECT m.*, d.name as doctor_name, d.specialty, p.first_name, p.last_name
       FROM medical_records m
       JOIN doctors d ON m.doctor_id = d.id
       JOIN patients p ON m.patient_id = p.id
       WHERE m.id = $1`,
      [id],
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const {
      diagnosis,
      treatment,
      medications,
      follow_up_required,
      follow_up_date,
      notes,
    } = data;
    const result = await db.query(
      `UPDATE medical_records
       SET diagnosis = $1, treatment = $2, medications = $3, follow_up_required = $4, follow_up_date = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        diagnosis,
        treatment,
        medications,
        follow_up_required,
        follow_up_date,
        notes,
        id,
      ],
    );
    return result.rows[0];
  }

  static async getByAppointment(appointment_id) {
    const result = await db.query(
      "SELECT * FROM medical_records WHERE appointment_id = $1",
      [appointment_id],
    );
    return result.rows[0];
  }
}

module.exports = MedicalRecord;
