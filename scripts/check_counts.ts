
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    const result = await db.execute(sql`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'id'
  `);

    console.log("Users ID Type:", result);

    const userIdResult = await db.execute(sql`
    SELECT table_name, data_type
    FROM information_schema.columns
    WHERE column_name = 'user_id'
    AND table_schema = 'public'
    AND data_type != 'uuid'
  `);

    if (userIdResult.length > 0) {
        console.log("Tables with non-uuid user_id:", userIdResult.map((r: any) => `${r.table_name} (${r.data_type})`));
    } else {
        console.log("No non-uuid user_id columns found (or all dropped already).");
    }

    // Original created_by check (kept for context, but not part of the new instruction's focus)
    const createdByResult = await db.execute(sql`
    SELECT table_name, data_type
    FROM information_schema.columns
    WHERE column_name = 'created_by'
    AND table_schema = 'public'
    AND data_type != 'uuid'
  `);

    if (createdByResult.length === 0) {
        console.log("No non-uuid created_by columns found.");
    } else {
        console.log("Tables with non-uuid created_by:", createdByResult.map((r: any) => `${r.table_name} (${r.data_type})`));
    }

    // The 'tables' variable was originally derived from the 'created_by' check.
    // Assuming the loop should still operate on tables with non-uuid 'created_by' columns.
    const tables = createdByResult.map((r: any) => r.table_name); // Define 'tables' for the loop based on createdByResult

    for (const table of tables) {
        try {
            const c = await db.execute(sql.raw(`SELECT count(*) as c FROM "${table}"`));
            console.log(`${table}: ${c[0].c}`);
        } catch (e) {
            console.log(`${table}: Error`, e);
        }
    }
    process.exit(0);
}

main().catch(console.error);
