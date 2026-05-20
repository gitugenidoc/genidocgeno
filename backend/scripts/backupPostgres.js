require("dotenv").config();
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const backupDir = process.env.BACKUP_DIR || path.join(__dirname, "..", "..", "backups");
fs.mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = path.join(backupDir, `genidoc-${stamp}.dump`);

const args = [
  "-h",
  process.env.DB_HOST || "localhost",
  "-p",
  String(process.env.DB_PORT || 5432),
  "-U",
  process.env.DB_USER || "postgres",
  "-F",
  "c",
  "-f",
  file,
  process.env.DB_NAME || "genidoc_hayat",
];

const result = spawnSync("pg_dump", args, {
  stdio: "inherit",
  env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || "" },
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log(`PostgreSQL backup created: ${file}`);
