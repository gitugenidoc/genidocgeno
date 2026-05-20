const db = require("../config/database");
const SchoolStudent = require("./SchoolStudent");
const ParentPortal = require("./ParentPortal");
const {
  encryptAndStore,
  readAndDecrypt,
  deleteStoredFile,
} = require("../utils/fileEncryption");

class Document {
  static async canAccessStudent(studentId, user) {
    if (user.roles.some((role) => ["SCHOOL_ADMIN", "SCHOOL_NURSE"].includes(role))) {
      const student = await SchoolStudent.findByIdForSchool(studentId, user.school_id);
      return student ? { allowed: true, student } : { allowed: false };
    }

    if (user.roles.includes("PARENT")) {
      const child = await ParentPortal.getChildForUser(studentId, user);
      return child ? { allowed: true, student: child } : { allowed: false };
    }

    return { allowed: false };
  }

  static async listForStudent(studentId, user) {
    const access = await this.canAccessStudent(studentId, user);
    if (!access.allowed) return null;

    const result = await db.query(
      `SELECT d.id, d.student_id, d.document_type, d.title, d.original_filename,
              d.mime_type, d.file_size, d.status, d.uploaded_at,
              u.first_name AS uploaded_by_first_name,
              u.last_name AS uploaded_by_last_name
       FROM documents d
       LEFT JOIN users u ON u.id = d.uploaded_by
       WHERE d.student_id = $1 AND d.deleted_at IS NULL
       ORDER BY d.uploaded_at DESC`,
      [studentId],
    );
    return result.rows;
  }

  static async createForStudent(studentId, user, data) {
    const access = await this.canAccessStudent(studentId, user);
    if (!access.allowed) return null;

    const {
      document_type,
      title,
      filename,
      mime_type,
      content_base64,
    } = data;

    const stored = await encryptAndStore({
      base64Content: content_base64,
      filename,
    });

    const result = await db.query(
      `INSERT INTO documents (
        school_id, student_id, document_type, title, original_filename,
        mime_type, file_size, storage_path, encryption_iv, encryption_tag,
        uploaded_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, school_id, student_id, document_type, title,
                 original_filename, mime_type, file_size, status, uploaded_at`,
      [
        access.student.school_id,
        studentId,
        document_type || "autre",
        title || filename,
        filename,
        mime_type || "application/octet-stream",
        stored.fileSize,
        stored.storagePath,
        stored.encryptionIv,
        stored.encryptionTag,
        user.id,
      ],
    );

    await db.query(
      `INSERT INTO document_versions (
        document_id, version_number, storage_path, file_size,
        encryption_iv, encryption_tag, created_by
      )
       VALUES ($1, 1, $2, $3, $4, $5, $6)`,
      [
        result.rows[0].id,
        stored.storagePath,
        stored.fileSize,
        stored.encryptionIv,
        stored.encryptionTag,
        user.id,
      ],
    );

    return result.rows[0];
  }

  static async findAccessible(documentId, user) {
    const result = await db.query(
      `SELECT id, school_id, student_id, document_type, title, original_filename,
              mime_type, file_size, storage_path, encryption_iv, encryption_tag,
              uploaded_by, status
       FROM documents
       WHERE id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [documentId],
    );
    const document = result.rows[0];
    if (!document) return null;

    const access = await this.canAccessStudent(document.student_id, user);
    if (!access.allowed) return null;
    return document;
  }

  static async download(documentId, user, req) {
    const document = await this.findAccessible(documentId, user);
    if (!document) return null;

    const buffer = await readAndDecrypt(document);
    await db.query(
      `INSERT INTO document_access_logs (
        document_id, user_id, action, ip_address, user_agent
      )
       VALUES ($1, $2, $3, $4, $5)`,
      [
        document.id,
        user.id,
        "DOCUMENT_DOWNLOADED",
        req.ip || req.socket?.remoteAddress || null,
        req.headers["user-agent"] || null,
      ],
    );

    return { document, buffer };
  }

  static async delete(documentId, user) {
    const document = await this.findAccessible(documentId, user);
    if (!document) return null;

    const canDelete =
      user.roles.includes("SCHOOL_ADMIN") || document.uploaded_by === user.id;
    if (!canDelete) return false;

    await db.query(
      `UPDATE documents
       SET deleted_at = NOW(), status = 'deleted'
       WHERE id = $1`,
      [documentId],
    );
    await deleteStoredFile(document.storage_path);
    return true;
  }
}

module.exports = Document;
