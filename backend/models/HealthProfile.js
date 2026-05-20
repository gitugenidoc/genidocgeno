const db = require("../config/database");
const SchoolStudent = require("./SchoolStudent");

class HealthProfile {
  static async ensureStudent(studentId, schoolId) {
    return SchoolStudent.findByIdForSchool(studentId, schoolId);
  }

  static async get(studentId, schoolId) {
    const student = await this.ensureStudent(studentId, schoolId);
    if (!student) return null;

    const profileResult = await db.query(
      `SELECT id, student_id, blood_type, regular_treatment, medical_diet,
              emergency_protocol, treating_doctor_name, treating_doctor_phone,
              treating_doctor_clinic, critical_notes, updated_at
       FROM health_profiles
       WHERE student_id = $1
       LIMIT 1`,
      [studentId],
    );

    const allergies = await db.query(
      `SELECT id, allergen, severity, reaction, notes
       FROM allergies
       WHERE student_id = $1
       ORDER BY severity DESC, allergen`,
      [studentId],
    );

    const conditions = await db.query(
      `SELECT id, condition_name, severity, notes
       FROM health_conditions
       WHERE student_id = $1
       ORDER BY severity DESC, condition_name`,
      [studentId],
    );

    const medications = await db.query(
      `SELECT id, medication_name, dosage, frequency, notes
       FROM medications
       WHERE student_id = $1
       ORDER BY medication_name`,
      [studentId],
    );

    const notes = await db.query(
      `SELECT id, note, created_at
       FROM medical_notes
       WHERE student_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [studentId],
    );

    return {
      profile: profileResult.rows[0] || null,
      allergies: allergies.rows,
      conditions: conditions.rows,
      medications: medications.rows,
      notes: notes.rows,
    };
  }

  static async upsert(studentId, schoolId, data, userId) {
    const student = await this.ensureStudent(studentId, schoolId);
    if (!student) return null;

    const {
      blood_type,
      regular_treatment,
      medical_diet,
      emergency_protocol,
      treating_doctor_name,
      treating_doctor_phone,
      treating_doctor_clinic,
      critical_notes,
      allergies = [],
      conditions = [],
      medications = [],
      note,
    } = data;

    await db.query("BEGIN");
    try {
      await db.query(
        `INSERT INTO health_profiles (
          student_id, school_id, blood_type, regular_treatment, medical_diet,
          emergency_protocol, treating_doctor_name, treating_doctor_phone,
          treating_doctor_clinic, critical_notes, created_by, updated_by
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
         ON CONFLICT (student_id)
         DO UPDATE SET blood_type = EXCLUDED.blood_type,
                       regular_treatment = EXCLUDED.regular_treatment,
                       medical_diet = EXCLUDED.medical_diet,
                       emergency_protocol = EXCLUDED.emergency_protocol,
                       treating_doctor_name = EXCLUDED.treating_doctor_name,
                       treating_doctor_phone = EXCLUDED.treating_doctor_phone,
                       treating_doctor_clinic = EXCLUDED.treating_doctor_clinic,
                       critical_notes = EXCLUDED.critical_notes,
                       updated_at = NOW(),
                       updated_by = EXCLUDED.updated_by`,
        [
          studentId,
          schoolId,
          blood_type || null,
          regular_treatment || null,
          medical_diet || null,
          emergency_protocol || null,
          treating_doctor_name || null,
          treating_doctor_phone || null,
          treating_doctor_clinic || null,
          critical_notes || null,
          userId,
        ],
      );

      await db.query("DELETE FROM allergies WHERE student_id = $1", [studentId]);
      for (const item of allergies.filter((entry) => entry.allergen)) {
        await db.query(
          `INSERT INTO allergies (student_id, school_id, allergen, severity, reaction, notes, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            studentId,
            schoolId,
            item.allergen,
            item.severity || "non_renseigné",
            item.reaction || null,
            item.notes || null,
            userId,
          ],
        );
      }

      await db.query("DELETE FROM health_conditions WHERE student_id = $1", [studentId]);
      for (const item of conditions.filter((entry) => entry.condition_name)) {
        await db.query(
          `INSERT INTO health_conditions (student_id, school_id, condition_name, severity, notes, created_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            studentId,
            schoolId,
            item.condition_name,
            item.severity || "non_renseigné",
            item.notes || null,
            userId,
          ],
        );
      }

      await db.query("DELETE FROM medications WHERE student_id = $1", [studentId]);
      for (const item of medications.filter((entry) => entry.medication_name)) {
        await db.query(
          `INSERT INTO medications (student_id, school_id, medication_name, dosage, frequency, notes, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            studentId,
            schoolId,
            item.medication_name,
            item.dosage || null,
            item.frequency || null,
            item.notes || null,
            userId,
          ],
        );
      }

      if (note) {
        await db.query(
          `INSERT INTO medical_notes (student_id, school_id, note, created_by)
           VALUES ($1, $2, $3, $4)`,
          [studentId, schoolId, note, userId],
        );
      }

      await db.query("COMMIT");
      return this.get(studentId, schoolId);
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  }
}

module.exports = HealthProfile;
