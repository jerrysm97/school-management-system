#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function importData() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting data import...\n');

        await client.query('BEGIN');

        // 1. Users
        console.log('📝 Importing users...');
        await client.query(`
      INSERT INTO users (name, username, role, password, email) VALUES
      ('John Administrator', 'john.admin', 'admin', '$2b$10$XYZ', 'john.admin@university.edu'),
      ('Sarah Finance', 'sarah.finance', 'accountant', '$2b$10$XYZ', 'sarah.finance@university.edu'),
      ('Mike Accounts', 'mike.accounts', 'accountant', '$2b$10$XYZ', 'mike.accounts@university.edu'),
      ('Dr. Robert Smith', 'dr.smith', 'teacher', '$2b$10$XYZ', 'dr.smith@university.edu'),
      ('Prof. Emily Johnson', 'prof.johnson', 'teacher', '$2b$10$XYZ', 'prof.johnson@university.edu')
      ON CONFLICT (username) DO NOTHING
    `);

        // 2. Departments
        console.log('🏢 Importing departments...');
        await client.query(`
      INSERT INTO departments (name, code, budget_allocation) VALUES
      ('Computer Science', 'CS', 500000.00),
      ('Business Administration', 'BA', 450000.00),
      ('Engineering', 'ENG', 600000.00),
      ('Medical Sciences', 'MED', 800000.00)
      ON CONFLICT DO NOTHING
    `);

        // 3. Programs
        console.log('🎓 Importing programs...');
        const deptResult = await client.query('SELECT id, code FROM departments LIMIT 4');
        const deptMap = {};
        deptResult.rows.forEach(r => deptMap[r.code] = r.id);

        await client.query(`
      INSERT INTO programs (department_id, name, code, level, duration_years, total_credits) VALUES
      ($1, 'Bachelor of Computer Science', 'BCS', 'undergraduate', 4, 120),
      ($2, 'Bachelor of Business Administration', 'BBA', 'undergraduate', 4, 120),
      ($3, 'Bachelor of Civil Engineering', 'BCE', 'undergraduate', 4, 130),
      ($4, 'Bachelor of Medicine', 'MBBS', 'undergraduate', 5, 180)
      ON CONFLICT DO NOTHING
    `, [deptMap['CS'], deptMap['BA'], deptMap['ENG'], deptMap['MED']]);

        // 4. Academic Years
        console.log('📅 Importing academic years...');
        await client.query(`
      INSERT INTO academic_years (year_code, start_date, end_date, is_active) VALUES
      ('2024-2025', '2024-09-01', '2025-06-30', true),
      ('2025-2026', '2025-09-01', '2026-06-30', false)
      ON CONFLICT DO NOTHING
    `);

        // 5. Semesters
        console.log('📚 Importing semesters...');
        const ayResult = await client.query(`SELECT id FROM academic_years WHERE year_code = '2024-2025'`);
        const ayId = ayResult.rows[0]?.id;

        if (ayId) {
            await client.query(`
        INSERT INTO semesters (academic_year_id, name, semester_number, start_date, end_date, registration_start, registration_deadline, is_active) VALUES
        ($1, 'Spring 2025', 2, '2025-01-10', '2025-05-25', '2024-12-01', '2024-12-30', true)
        ON CONFLICT DO NOTHING
      `, [ayId]);
        }

        //6. Students
        console.log('👥 Importing students...');
        const progResult = await client.query('SELECT id, code FROM programs LIMIT 4');
        const progMap = {};
        progResult.rows.forEach(r => progMap[r.code] = r.id);

        const students = [];
        for (let i = 1; i <= 20; i++) {
            const progCode = i <= 5 ? 'BCS' : i <= 10 ? 'BBA' : i <= 15 ? 'BCE' : 'MBBS';
            students.push(`(
        'STU202400${i}', 'Student${i}', 'LastName${i}',
        'student${i}@university.edu', '555-010${i}',
        ${progMap[progCode]}, '2024-09-01', ${(i - 1) % 8 + 1}, 'active',
        'Guardian${i}', '555-020${i}', 'guardian${i}@email.com'
      )`);
        }

        await client.query(`
      INSERT INTO students (student_id, first_name, last_name, email, phone, program_id, enrollment_date, current_semester, status, guardian_name, guardian_contact, guardian_email)
      VALUES ${students.join(',')}
      ON CONFLICT (student_id) DO NOTHING
    `);

        await client.query('COMMIT');
        console.log('\n✅ Data import completed successfully!');
        console.log('\n📊 Summary:');

        const counts = await Promise.all([
            client.query('SELECT COUNT(*) FROM users'),
            client.query('SELECT COUNT(*) FROM departments'),
            client.query('SELECT COUNT(*) FROM programs'),
            client.query('SELECT COUNT(*) FROM students')
        ]);

        console.log(`   Users: ${counts[0].rows[0].count}`);
        console.log(`   Departments: ${counts[1].rows[0].count}`);
        console.log(`   Programs: ${counts[2].rows[0].count}`);
        console.log(`   Students: ${counts[3].rows[0].count}`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error importing data:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

importData().catch(console.error);
