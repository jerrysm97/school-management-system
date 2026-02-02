
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Dropping ALL tables to fix schema migration (Nuclear Option)...");

    // Get all tables
    const result = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    `);

    const tables = result.map((row: any) => row.table_name);

    if (tables.length === 0) {
        console.log("No tables found to drop.");
    } else {
        console.log(`Found ${tables.length} tables to drop:`, tables.join(", "));

        // Drop each table with CASCADE
        for (const table of tables) {
            try {
                await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE`));
                console.log(`Dropped ${table}`);
            } catch (error) {
                console.error(`Failed to drop ${table}:`, error);
            }
        }
    }

    console.log("All tables dropped. Database is clean.");
    process.exit(0);
}

main().catch(console.error);
