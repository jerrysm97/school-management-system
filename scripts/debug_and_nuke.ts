
import { getSqlClient } from "../server/db";

async function main() {
    const sql = getSqlClient();
    console.log("Debugging Schema...");

    // Check if fin_expenses exists
    const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'fin_expenses'
  `;

    if (tables.length > 0) {
        console.log("Table 'fin_expenses' EXISTS.");

        // Check column type
        const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'fin_expenses' AND column_name = 'approved_by'
    `;
        console.log("Column 'approved_by' details:", cols);

        console.log("Attempting to DROP table again...");
        await sql`DROP TABLE fin_expenses CASCADE`;
        console.log("Drop command executed.");

        // Check again
        const tablesAfter = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'fin_expenses'
    `;
        if (tablesAfter.length === 0) {
            console.log("Table 'fin_expenses' successfully GONE.");
        } else {
            console.log("Table 'fin_expenses' STILL EXISTS. WTH.");
        }

    } else {
        console.log("Table 'fin_expenses' DOES NOT EXIST.");
    }

    // Check library_books
    const libTables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'library_books'
  `;
    console.log(`Table 'library_books' exists? ${libTables.length > 0}`);

    process.exit(0);
}

main();
