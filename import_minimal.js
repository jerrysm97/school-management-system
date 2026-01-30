#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function importData() {
    const client = await pool.connect();

    try {
        console.log('🚀 Importing basic finance test data...\n');
        await client.query('BEGIN');

        // 1. Users
        console.log('📝 Users...');
        await client.query(
            `INSERT INTO users (name, username, role, password, email) VALUES 
       ('Admin', 'admin', 'admin', '$2b$10$XYZ', 'admin@u.edu'),
       ('Sarah Finance', 'sarah.fin', 'accountant', '$2b$10$XYZ', 'sarah@u.edu'),
       ('Mike Accounts', 'mike.acc', 'accountant', '$2b$10$XYZ', 'mike@u.edu')
       ON CONFLICT (username) DO NOTHING`
        );

        // 2. Departments
        console.log('🏢 Departments...');
        await client.query(
            `INSERT INTO departments (code, name, budget_allocation) VALUES 
       ('CS', 'Computer Science', 500000),
       ('BA', 'Business Admin', 450000),
       ('ENG', 'Engineering', 600000)
       ON CONFLICT (code) DO NOTHING`
        );

        // 3. Programs
        console.log('🎓 Programs...');
        const depts = await client.query('SELECT id, code FROM departments WHERE code IN ($1, $2, $3)', ['CS', 'BA', 'ENG']);
        const deptMap = {};
        depts.rows.forEach(r => deptMap[r.code] = r.id);

        if (deptMap['CS']) {
            await client.query(
                `INSERT INTO programs (department_id, name, code, level, duration_years, total_credits) VALUES 
         ($1, 'Bachelor of Computer Science', 'BCS', 'undergraduate', 4, 120)
         ON CONFLICT DO NOTHING`,
                [deptMap['CS']]
            );
        }

        if (deptMap['BA']) {
            await client.query(
                `INSERT INTO programs (department_id, name, code, level, duration_years, total_credits) VALUES 
         ($1, 'Bachelor of Business', 'BBA', 'undergraduate', 4, 120)
         ON CONFLICT DO NOTHING`,
                [deptMap['BA']]
            );
        }

        await client.query('COMMIT');
        console.log('\n✅ Import completed!\n');

        const counts = await Promise.all([
            client.query('SELECT COUNT(*) FROM users'),
            client.query('SELECT COUNT(*) FROM departments'),
            client.query('SELECT COUNT(*) FROM programs'),
        ]);

        console.log('📊 Summary:');
        console.log(`   Users: ${counts[0].rows[0].count}`);
        console.log(`   Departments: ${counts[1].rows[0].count}`);
        console.log(`   Programs: ${counts[2].rows[0].count}\n`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

importData().catch(console.error);
