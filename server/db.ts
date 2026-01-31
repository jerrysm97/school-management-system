import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Graceful fallback to prevent crash on import, allows API to start and report error later
const dbUrl = process.env.DATABASE_URL || "postgres://mock:mock@localhost:5432/mock";

if (!process.env.DATABASE_URL) {
  console.error("CRITICAL: DATABASE_URL is not set. All DB operations will fail.");
}

const isProduction = process.env.NODE_ENV === "production";
const connectionConfig = {
  connectionString: dbUrl,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
  max: isProduction ? 2 : 10, // Limit connections in serverless to prevent exhaustion
};

export const pool = new Pool(connectionConfig);
export const db = drizzle(pool, { schema });
