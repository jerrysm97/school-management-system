import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Clearing all sessions...");

    try {
        await db.execute(sql`DELETE FROM session`);
        console.log("All sessions cleared!");
    } catch (error) {
        console.log("Session table may not exist or is empty:", error);
    }

    process.exit(0);
}

main().catch(console.error);
