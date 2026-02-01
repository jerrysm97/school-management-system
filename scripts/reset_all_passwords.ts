import { db } from "../server/db";
import { users } from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function main() {
    const newPassword = "password123";
    console.log(`Resetting all user passwords to: ${newPassword}`);

    try {
        const hashedPassword = await hashPassword(newPassword);

        // Update all users
        // Note: In Drizzle, to update all rows, we usually typically need a where clause or just omit it if supported.
        // Ideally we iterate or just run a global update. 
        // Let's try to update all users.

        // Fetch all users first to verify
        const allUsers = await db.select().from(users);
        console.log(`Found ${allUsers.length} users.`);

        for (const user of allUsers) {
            console.log(`Updating password for user: ${user.username} (ID: ${user.id})`);
            await db.update(users)
                .set({ password: hashedPassword })
                .where(eq(users.id, user.id));
        }

        console.log("Password reset complete.");
        process.exit(0);
    } catch (error) {
        console.error("Error resetting passwords:", error);
        process.exit(1);
    }
}

main();
