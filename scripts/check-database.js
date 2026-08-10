import "dotenv/config";
import { sql } from "drizzle-orm";
import { getDatabase, getPool } from "../lib/db/index.js";

if (!process.env.DATABASE_URL) {
  console.log("Database check skipped: DATABASE_URL is not configured.");
  process.exit(0);
}
await getDatabase().execute(sql`select 1`);
await getPool().end();
console.log("Database connection: ok");
