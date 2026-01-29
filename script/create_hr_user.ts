import { storage } from "../server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function createHR() {
    try {
        const username = "hr_manager";
        const existing = await storage.getUserByUsername(username);
        if (existing) {
            console.log("HR user already exists");
            process.exit(0);
        }

        const password = await hashPassword("password123");

        await storage.createUser({
            username: username,
            password: password,
            role: "principal", // Mapping to principal for now as a high-level admin role if 'hr' role not in enum
            name: "HR Manager",
            email: "hr@example.com",
        });
        console.log("HR Manager user created successfully (password: password123)");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

createHR();
