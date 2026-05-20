const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { getStorageEncryptionSecret } = require("../config/security");

const STORAGE_ROOT = path.join(__dirname, "..", "..", "storage", "documents");

function encryptionKey() {
  return crypto.createHash("sha256").update(getStorageEncryptionSecret()).digest();
}

async function ensureStorage() {
  await fs.mkdir(STORAGE_ROOT, { recursive: true });
}

function safeExt(filename) {
  const ext = path.extname(filename || "").toLowerCase().replace(/[^a-z0-9.]/g, "");
  return ext || ".bin";
}

async function encryptAndStore({ base64Content, filename }) {
  await ensureStorage();
  const buffer = Buffer.from(base64Content, "base64");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  const storedName = `${crypto.randomUUID()}${safeExt(filename)}.enc`;
  const relativePath = storedName;
  await fs.writeFile(path.join(STORAGE_ROOT, storedName), encrypted);
  return {
    storagePath: relativePath,
    fileSize: buffer.length,
    encryptionIv: iv.toString("base64"),
    encryptionTag: tag.toString("base64"),
  };
}

async function readAndDecrypt(file) {
  const storagePath = file.storagePath || file.storage_path;
  const encryptionIv = file.encryptionIv || file.encryption_iv;
  const encryptionTag = file.encryptionTag || file.encryption_tag;
  const encrypted = await fs.readFile(path.join(STORAGE_ROOT, storagePath));
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(encryptionIv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encryptionTag, "base64"));
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

async function deleteStoredFile(storagePath) {
  if (!storagePath) return;
  await fs.unlink(path.join(STORAGE_ROOT, storagePath)).catch(() => {});
}

module.exports = {
  encryptAndStore,
  readAndDecrypt,
  deleteStoredFile,
};
