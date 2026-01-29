import { storage } from "../server/storage";
import { insertUserSchema } from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
    try {
        const existing = await storage.getUserByUsername("admin");
        if (existing) {
            console.log("Admin user already exists");
            process.exit(0);
        }

        const password = await hashPassword("password123");

        await storage.createUser({
            username: "admin",
            password: password,
            role: "main_admin",
            name: "System Administrator",
            email: "admin@example.com",
        });
        console.log("Admin user created successfully");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

createAdmin();
