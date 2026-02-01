
import { getSqlClient } from "../server/db";

async function main() {
    const sql = getSqlClient();
    console.log("Dropping problematic tables to force clean schema sync...");

    try {
        await sql`DROP TABLE IF EXISTS fin_expenses CASCADE`;
        await sql`DROP TABLE IF EXISTS fin_income CASCADE`;
        console.log("Tables dropped.");
    } catch (err) {
        console.error("Error dropping tables:", err);
    } finally {
        process.exit(0);
    }
}

main();
