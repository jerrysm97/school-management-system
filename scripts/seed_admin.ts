import { db } from "../server/db";
import { users } from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function main() {
    console.log("Seeding admin user...");

    // Hash password
    const hashedPassword = await hashPassword("admin123");

    // Insert admin user
    const [adminUser] = await db.insert(users).values({
        username: "admin",
        email: "admin@school.com",
        password: hashedPassword,
        name: "Administrator",
        role: "admin",
    }).returning();

    console.log("Created admin user:", adminUser.email);
    console.log("Password: admin123");
    console.log("✓ Admin user seeded successfully!");
    console.log("\nYou can now log in with:");
    console.log("  Email: admin@school.com");
    console.log("  Password: admin123");

    process.exit(0);
}

main().catch((error) => {
    console.error("Error seeding admin:", error);
    process.exit(1);
});
