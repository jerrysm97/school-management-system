#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function importData() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting simplified data import...\n');

        await client.query('BEGIN');

        // 1. Users
        console.log('📝 Importing users...');
        const userInserts = [
            ['John Admin', 'john.admin2', 'admin', '$2b$10$XYZ', 'john.admin2@university.edu'],
            ['Sarah Finance', 'sarah.finance2', 'accountant', '$2b$10$XYZ', 'sarah.finance2@university.edu'],
            ['Mike Accounts', 'mike.accounts2', 'accountant', '$2b$10$XYZ', 'mike.accounts2@university.edu'],
        ];

        for (const [name, username, role, password, email] of userInserts) {
            await client.query(
                `INSERT INTO users (name, username, role, password, email) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING`,
                [name, username, role, password, email]
            );
        }

        // 2. Departments
        console.log('🏢 Importing departments...');
        const deptInserts = [
            ['CS', 'Computer Science', 'Computer Science Department', 500000],
            ['BA', 'Business Administration', 'Business Admin Department', 450000],
            ['ENG', 'Engineering', 'Engineering Department', 600000],
            ['MED', 'Medical Sciences', 'Medical Department', 800000],
        ];

        for (const [code, name, description, budget] of deptInserts) {
            await client.query(
                `INSERT INTO departments (code, name, description, budget_allocation) VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO NOTHING`,
                [code, name, description, budget]
            );
        }

        // 3. Programs
        console.log('🎓 Importing programs...');
        const depts = await client.query('SELECT id, code FROM departments WHERE code IN ($1, $2, $3, $4)', ['CS', 'BA', 'ENG', 'MED']);
        const deptMap = {};
        depts.rows.forEach(r => deptMap[r.code] = r.id);

        const progInserts = [
            [deptMap['CS'], 'Bachelor of Computer Science', 'BCS', 'undergraduate', 4, 120],
            [deptMap['BA'], 'Bachelor of Business Administration', 'BBA', 'undergraduate', 4, 120],
            [deptMap['ENG'], 'Bachelor of Civil Engineering', 'BCE', 'undergraduate', 4, 130],
            [deptMap['MED'], 'Bachelor of Medicine', 'MBBS', 'undergraduate', 5, 180],
        ];

        for (const [deptId, name, code, level, duration, credits] of progInserts) {
            await client.query(
                `INSERT INTO programs (department_id, name, code, level, duration_years, total_credits) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
                [deptId, name, code, level, duration, credits]
            );
        }

        // 4. Academic Years
        console.log('📅 Importing academic years...');
        await client.query(
            `INSERT INTO academic_years (year_code, start_date, end_date, is_active) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
            ['2024-2025', '2024-09-01', '2025-06-30', true]
        );

        // 5. Semesters
        console.log('📚 Importing semesters...');
        const ayResult = await client.query(`SELECT id FROM academic_years WHERE year_code = '2024-2025'`);
        const ayId = ayResult.rows[0]?.id;

        if (ayId) {
            await client.query(
                `INSERT INTO semesters (academic_year_id, name, semester_number, start_date, end_date, registration_start, registration_deadline, is_active) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
                [ayId, 'Spring 2025', 2, '2025-01-10', '2025-05-25', '2024-12-01', '2024-12-30', true]
            );
        }

        // 6. Students
        console.log('👥 Importing 20 students...');
        const progs = await client.query('SELECT id, code FROM programs WHERE code IN ($1, $2, $3, $4)', ['BCS', 'BBA', 'BCE', 'MBBS']);
        const progMap = {};
        progs.rows.forEach(r => progMap[r.code] = r.id);

        for (let i = 1; i <= 20; i++) {
            const progCode = i <= 5 ? 'BCS' : i <= 10 ? 'BBA' : i <= 15 ? 'BCE' : 'MBBS';
            const studentId = `STU2024${String(i).padStart(3, '0')}`;
            const semester = (i - 1) % 8 + 1;

            await client.query(
                `INSERT INTO students (student_id, first_name, last_name, email, phone, program_id, enrollment_date, current_semester, status, guardian_name, guardian_contact, guardian_email)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (student_id) DO NOTHING`,
                [
                    studentId, `Student${i}`, `LastName${i}`,
                    `student${i}@university.edu`, `555-${1000 + i}`,
                    progMap[progCode], '2024-09-01', semester, 'active',
                    `Guardian${i}`, `555-${2000 + i}`, `guardian${i}@email.com`
                ]
            );
        }

        await client.query('COMMIT');
        console.log('\n✅ Data import completed successfully!\n');

        // Show summary
        const counts = await Promise.all([
            client.query('SELECT COUNT(*) FROM users'),
            client.query('SELECT COUNT(*) FROM departments'),
            client.query('SELECT COUNT(*) FROM programs'),
            client.query('SELECT COUNT(*) FROM students'),
        ]);

        console.log('📊 Database Summary:');
        console.log(`   👤 Users: ${counts[0].rows[0].count}`);
        console.log(`   🏢 Departments: ${counts[1].rows[0].count}`);
        console.log(`   🎓 Programs: ${counts[2].rows[0].count}`);
        console.log(`   👥 Students: ${counts[3].rows[0].count}\n`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error importing data:', error.message);
        console.error('   Details:', error.detail || 'No additional details');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

importData().catch(console.error);
