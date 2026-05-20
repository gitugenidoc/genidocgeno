const MIN_SECRET_LENGTH = 32;

function getRequiredSecret(name, fallbackName) {
  const value = process.env[name] || (fallbackName ? process.env[fallbackName] : null);

  if (process.env.NODE_ENV === "production") {
    if (!value || value.length < MIN_SECRET_LENGTH) {
      throw new Error(`${name} doit contenir au moins ${MIN_SECRET_LENGTH} caracteres en production`);
    }
  }

  return value || "dev_only_secret_change_me";
}

function getJwtSecret() {
  return getRequiredSecret("JWT_SECRET", "SESSION_SECRET");
}

function getStorageEncryptionSecret() {
  return getRequiredSecret("STORAGE_ENCRYPTION_KEY", "SESSION_SECRET");
}

module.exports = {
  getJwtSecret,
  getStorageEncryptionSecret,
};
