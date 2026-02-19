import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// ========================================
// SUPABASE-OPTIMIZED DATABASE CONNECTION
// ========================================

// Singleton instance
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlClient: ReturnType<typeof postgres> | null = null;

/**
 * Get the database URL with validation
 */
function getDbUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("CRITICAL: DATABASE_URL is not set. All DB operations will fail.");
    // Return a mock URL to prevent immediate crash, allows API to start
    return "postgres://mock:mock@localhost:5432/mock";
  }
  return url;
}

/**
 * Create a new postgres-js connection with Supabase optimizations
 */
function createConnection() {
  const isProduction = process.env.NODE_ENV === "production";
  const dbUrl = getDbUrl();

  // postgres-js configuration optimized for Supabase
  const client = postgres(dbUrl, {
    // Connection pool settings
    max: isProduction ? 2 : 10, // Limit connections in serverless
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Connection timeout in seconds

    // Supabase-specific settings
    prepare: false, // Required for Supabase transaction pooling

    // SSL settings for production.
    // SECURITY: rejectUnauthorized: false disables certificate chain verification,
    // which enables MITM attacks on the DB connection. Always use true in production.
    ssl: isProduction ? { rejectUnauthorized: true } : false,

    // Connection lifecycle hooks
    onnotice: () => { }, // Suppress notice messages
  });

  return { client, db: drizzle(client, { schema }) };
}

/**
 * Get the singleton database instance
 * Uses lazy initialization for better startup performance
 */
export function getDb() {
  if (!dbInstance) {
    const connection = createConnection();
    sqlClient = connection.client;
    dbInstance = connection.db;
  }
  return dbInstance;
}

/**
 * Get the raw postgres-js client for advanced queries
 */
export function getSqlClient() {
  if (!sqlClient) {
    getDb(); // This will initialize the client
  }
  return sqlClient!;
}

/**
 * Close database connections gracefully
 * Call this on server shutdown
 */
export async function closeDb() {
  if (sqlClient) {
    await sqlClient.end();
    sqlClient = null;
    dbInstance = null;
  }
}

// ========================================
// LEGACY EXPORTS (Backward Compatibility)
// ========================================

// Default export for existing code that directly imports `db`
export const db = getDb();

// Re-export for type inference
export type DbClient = ReturnType<typeof getDb>;
export const pool = getSqlClient();
