import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const schemaPath = fileURLToPath(new URL("../sql/schema.sql", import.meta.url));
const schema = await readFile(schemaPath, "utf8");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(schema);
  console.log("Database schema is ready.");
} finally {
  await pool.end();
}
