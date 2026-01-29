import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function fixSchema() {
    try {
        console.log("Dropping conflicting tables...");
        await db.execute(sql`DROP TABLE IF EXISTS financial_transactions CASCADE;`);
        await db.execute(sql`DROP TYPE IF EXISTS fin_transaction_type CASCADE;`);
        // We don't drop 'transaction_type' as it is used by other tables likely (fees?)
        console.log("Tables dropped. Ready for push.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixSchema();
