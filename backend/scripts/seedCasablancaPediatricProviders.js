require("dotenv").config();
const db = require("../config/database");
const providers = require("../data/casablancaPediatricProviders");

async function main() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS private_pediatric_clinics (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(80) NOT NULL DEFAULT 'cabinet_pediatrique',
      specialties TEXT[] NOT NULL DEFAULT '{}',
      city VARCHAR(100) NOT NULL,
      district VARCHAR(120),
      address TEXT,
      phone VARCHAR(120),
      website TEXT,
      source_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_private_pediatric_clinics_name_city
      ON private_pediatric_clinics (LOWER(name), LOWER(city));

    CREATE INDEX IF NOT EXISTS idx_private_pediatric_clinics_city
      ON private_pediatric_clinics (LOWER(city));

    CREATE INDEX IF NOT EXISTS idx_private_pediatric_clinics_category
      ON private_pediatric_clinics (category);
  `);

  for (const provider of providers) {
    await db.query(
      `INSERT INTO private_pediatric_clinics (
        name, category, specialties, city, district, address, phone, website, source_url
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT ((LOWER(name)), (LOWER(city))) DO UPDATE SET
         category = EXCLUDED.category,
         specialties = EXCLUDED.specialties,
         district = EXCLUDED.district,
         address = EXCLUDED.address,
         phone = EXCLUDED.phone,
         website = EXCLUDED.website,
         source_url = EXCLUDED.source_url,
         updated_at = CURRENT_TIMESTAMP`,
      [
        provider.name,
        provider.category,
        provider.specialties,
        provider.city,
        provider.district,
        provider.address,
        provider.phone,
        provider.website,
        provider.source_url,
      ],
    );
  }

  console.log(`Casablanca pediatric provider directory seeded: ${providers.length} providers.`);
}

main()
  .then(() => db.end())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
