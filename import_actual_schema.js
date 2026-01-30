#!/usr/bin/env node
/**
 * Import script adapted to ACTUAL database schema
 * Works with the existing students table structure
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function importData() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting data import (adapted to actual schema)...\n');
        await client.query('BEGIN');

        // Step 1: Users
        console.log('📝 Importing users...');
        const adminResult = await client.query(
            'INSERT INTO users (name, username, role, password, email) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO UPDATE SET name=EXCLUDED.name RETURNING id',
            ['System Admin', 'admin', 'admin', '$2b$10$XYZ', 'admin@university.edu']
        );
        const adminId = adminResult.rows[0].id;

        // Import more users
        const userInserts = [
            ['Sarah Finance', 'sarah.finance', 'accountant', '$2b$10$XYZ', 'sarah@university.edu'],
            ['Mike Accounts', 'mike.accounts', 'accountant', '$2b$10$XYZ', 'mike@university.edu'],
            ['Dr. Smith', 'dr.smith', 'teacher', '$2b$10$XYZ', 'smith@university.edu'],
        ];

        for (const [name, username, role, password, email] of userInserts) {
            await client.query(
                'INSERT INTO users (name, username, role, password, email) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING',
                [name, username, role, password, email]
            );
        }

        // Step 2: Departments
        console.log('🏢 Importing departments...');
        const depts = [
            ['CS', 'Computer Science', '500000'],
            ['BA', 'Business', '450000'],
            ['ENG', 'Engineering', '600000'],
            ['MED', 'Medical', '800000'],
        ];

        for (const [code, name, budget] of depts) {
            await client.query(
                'INSERT INTO departments (code, name, budget_allocation) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING',
                [code, name, budget]
            );
        }

        // Step 3: Programs
        console.log('🎓 Importing programs...');
        const deptMap = {};
        const deptResult = await client.query('SELECT id, code FROM departments');
        deptResult.rows.forEach(r => deptMap[r.code] = r.id);

        const programs = [
            [deptMap['CS'], 'Bachelor of Computer Science', 'BCS', 'undergraduate', 4, 120],
            [deptMap['BA'], 'Bachelor of Business Admin', 'BBA', 'undergraduate', 4, 120],
            [deptMap['ENG'], 'Bachelor of Engineering', 'BE', 'undergraduate', 4, 130],
            [deptMap['MED'], 'Bachelor of Medicine', 'MBBS', 'undergraduate', 5, 180],
        ];

        for (const [deptId, name, code, level, duration, credits] of programs) {
            await client.query(
                'INSERT INTO programs (department_id, name, code, level, duration_years, total_credits) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
                [deptId, name, code, level, duration, credits]
            );
        }

        // Step 4: Create student users and students
        console.log('👥 Importing 20 students (using actual schema)...');

        // First create a class if it doesn't exist
        const classResult = await client.query(
            `INSERT INTO classes (name, grade_level) VALUES ('Grade 10', 10) 
       ON CONFLICT DO NOTHING RETURNING id`
        );
        let classId = classResult.rows[0]?.id;

        if (!classId) {
            const existingClass = await client.query('SELECT id FROM classes LIMIT 1');
            classId = existingClass.rows[0]?.id;
        }

        // Create parents
        await client.query(
            `INSERT INTO parents (name, phone, email) VALUES ('Parent Demo', '555-1000', 'parent@demo.com')
       ON CONFLICT DO NOTHING`
        );
        const parentResult = await client.query('SELECT id FROM parents LIMIT 1');
        const parentId = parentResult.rows[0]?.id;

        // Create student users and student records
        for (let i = 1; i <= 20; i++) {
            // Create user for student
            const studentUserResult = await client.query(
                `INSERT INTO users (name, username, role, password, email) 
         VALUES ($1, $2, 'student', '$2b$10$XYZ', $3) 
         ON CONFLICT (username) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
                [`Student ${i}`, `student${i}`, `student${i}@university.edu`]
            );
            const studentUserId = studentUserResult.rows[0].id;

            // Create student record
            await client.query(
                `INSERT INTO students (user_id, admission_no, class_id, dob, gender, status, parent_id) 
         VALUES ($1, $2, $3, $4, $5, 'active', $6) 
         ON CONFLICT (admission_no) DO NOTHING`,
                [studentUserId, `ADM2024${String(i).padStart(3, '0')}`, classId, '2010-01-01', 'male', parentId]
            );
        }

        await client.query('COMMIT');
        console.log('\n✅ Import completed!\n');

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
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

importData().catch(console.error);
