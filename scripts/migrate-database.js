import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDatabase, getPool } from "../lib/db/index.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to run migrations.");
await migrate(getDatabase(), { migrationsFolder: "drizzle" });
await getPool().end();
console.log("Database migrations complete.");
