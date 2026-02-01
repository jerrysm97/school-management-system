
import { getSqlClient } from "../server/db";

async function main() {
    const sql = getSqlClient();
    console.log("Fixing schema migration issues...");

    try {
        // Drop columns that are incompatible (Int -> UUID) and cannot be cast automatically.
        // Since IDs changed, old references are invalid anyway.

        // fin_expenses
        console.log("Dropping fin_expenses.approved_by...");
        await sql`ALTER TABLE fin_expenses DROP COLUMN IF EXISTS approved_by`;

        console.log("Dropping fin_expenses.payee_id...");
        await sql`ALTER TABLE fin_expenses DROP COLUMN IF EXISTS payee_id`;

        // fin_income
        console.log("Dropping fin_income.payer_id...");
        await sql`ALTER TABLE fin_income DROP COLUMN IF EXISTS payer_id`;

        console.log("Migration fixes applied.");
    } catch (err) {
        console.error("Error fixing schema:", err);
    } finally {
        process.exit(0);
    }
}

main();
