const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "genidoc_hospital",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD ?? "",
});

pool.on("error", (err) => {
  console.error("Erreur connexion BD:", err);
});

module.exports = pool;
