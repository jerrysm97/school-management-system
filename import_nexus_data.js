#!/usr/bin/env node
/**
 * Import Nexus Mock Data
 * Comprehensive dataset with 50 students, fees, payments, attendance
 */

import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function importNexusData() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting Nexus School Management System data import...\n');

        // Read the SQL file
        const sqlContent = fs.readFileSync('nexus_mock_data.sql', 'utf8');

        // Remove comments and split by semicolon
        const statements = sqlContent
            .split('\n')
            .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('/*'))
            .join('\n')
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

        let executed = 0;
        for (const statement of statements) {
            if (statement.toUpperCase().includes('INSERT INTO')) {
                await client.query(statement);
                executed++;
                if (executed % 10 === 0) {
                    process.stdout.write(`\r  Progress: ${executed}/${statements.length} statements...`);
                }
            }
        }

        console.log(`\n\n✅ Import completed! Executed ${executed} INSERT statements\n`);

        // Show summary
        const counts = await Promise.all([
            client.query('SELECT COUNT(*) FROM users WHERE role = $1', ['student']),
            client.query('SELECT COUNT(*) FROM students'),
            client.query('SELECT COUNT(*) FROM parents'),
            client.query('SELECT COUNT(*) FROM classes'),
            client.query('SELECT COUNT(*) FROM student_fees'),
            client.query('SELECT COUNT(*) FROM payments'),
            client.query('SELECT COUNT(*) FROM attendance'),
        ]);

        console.log('📊 Database Summary:');
        console.log(`   👤 Student Users: ${counts[0].rows[0].count}`);
        console.log(`   🎓 Students: ${counts[1].rows[0].count}`);
        console.log(`   👨‍👩‍👧 Parents: ${counts[2].rows[0].count}`);
        console.log(`   🏫 Classes: ${counts[3].rows[0].count}`);
        console.log(`   💰 Student Fees: ${counts[4].rows[0].count}`);
        console.log(`   💵 Payments: ${counts[5].rows[0].count}`);
        console.log(`   📅 Attendance Records: ${counts[6].rows[0].count}\n`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.position) {
            console.error(`   Position: ${error.position}`);
        }
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

importNexusData().catch(console.error);
