import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

let pool;
let database;

export function getDatabase() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  if (!pool) pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  if (!database) database = drizzle(pool, { schema });
  return database;
}

export function getPool() {
  getDatabase();
  return pool;
}
