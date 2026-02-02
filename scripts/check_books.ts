
import { db } from "../server/db";
import { libraryItems } from "../shared/schema";
import { count } from "drizzle-orm";

async function main() {
    const result = await db.select({ count: count() }).from(libraryItems);
    console.log("Total books in DB:", result[0].count);
    process.exit(0);
}

main().catch(console.error);
