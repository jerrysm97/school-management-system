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
    const username = "accountant";
    const password = "password123";

    console.log(`Creating user: ${username}`);

    try {
        const hashedPassword = await hashPassword(password);

        await db.insert(users).values({
            name: "Accountant",
            username: username,
            role: "accountant",
            password: hashedPassword,
            email: "accountant@school.edu",
        });

        console.log("User created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating user:", err);
        process.exit(1);
    }
}

main();
