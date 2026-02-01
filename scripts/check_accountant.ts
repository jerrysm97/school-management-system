import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function comparePassword(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const buf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(Buffer.from(hashed, "hex"), buf);
}

async function main() {
    const username = "accountant";
    console.log(`Checking user: ${username}`);

    const user = await db.query.users.findFirst({
        where: eq(users.username, username),
    });

    if (!user) {
        console.log("User not found!");
        process.exit(0);
    }

    console.log(`User found: ID ${user.id}`);
    console.log(`Stored password hash: ${user.password}`);

    const isMatch = await comparePassword("password123", user.password || "");
    console.log(`Password 'password123' matches: ${isMatch}`);

    process.exit(0);
}

main();
