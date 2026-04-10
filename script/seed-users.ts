/**
 * One-time script to create real users with properly hashed passwords.
 * Run: npx tsx script/seed-users.ts
 */
import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq, or } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  // @ts-ignore
  const buf = (await scryptAsync(password, salt, 64, SCRYPT_OPTIONS)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

const USERS_TO_CREATE = [
  { name: "Sujal Mainali", username: "sujalmainali11@gmail.com", email: "sujalmainali11@gmail.com", password: "sujal123", role: "main_admin" as const },
  { name: "Sujal Admin",   username: "sujal12@gmail.com",        email: "sujal12@gmail.com",        password: "sujal123", role: "admin" as const },
  { name: "Sujal Teacher", username: "sujal13@gmail.com",        email: "sujal13@gmail.com",        password: "sujal123", role: "teacher" as const },
  { name: "Sujal Student", username: "sujal14@gmail.com",        email: "sujal14@gmail.com",        password: "sujal123", role: "student" as const },
];

async function main() {
  console.log("=== User Setup Script ===\n");

  // Step 1: Delete any existing users with these emails (clean slate)
  for (const u of USERS_TO_CREATE) {
    const deleted = await db.delete(users).where(
      or(eq(users.email, u.email), eq(users.username, u.username))
    ).returning();
    if (deleted.length > 0) {
      console.log(`🗑️  Removed old user: ${deleted[0].username} (${deleted[0].email})`);
    }
  }

  // Step 2: Create fresh users with properly hashed passwords
  for (const u of USERS_TO_CREATE) {
    const hashedPw = await hashPassword(u.password);
    const [created] = await db.insert(users).values({
      name: u.name,
      username: u.username,
      email: u.email,
      password: hashedPw,
      role: u.role,
    }).returning();
    console.log(`✅ Created: ${created.email} | role: ${u.role} | id: ${created.id}`);
  }

  console.log("\n=== Done! You can now log in. ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
