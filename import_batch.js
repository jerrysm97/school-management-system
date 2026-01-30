#!/usr/bin/env node
/**
 * Batch Import Script for Nexus School Data
 * Imports data in stable, manageable batches
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function batchImport() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting batch import of Nexus School data...\n');

        // Batch 1: Admin/Teacher Users (17 users)
        console.log('📝 Batch 1/8: Importing admin & teacher users...');
        await client.query(`
      INSERT INTO users (name, username, email, password, role) VALUES
      ('System Administrator', 'admin', 'admin@nexus.edu', '$2b$10$XYZ', 'admin'),
      ('Sarah Finance', 'sarah.finance', 'sarah.finance@nexus.edu', '$2b$10$XYZ', 'accountant'),
      ('Mike Accounts', 'mike.accounts', 'mike.accounts@nexus.edu', '$2b$10$XYZ', 'accountant'),
      ('Dr. Robert Smith', 'dr.smith', 'robert.smith@nexus.edu', '$2b$10$XYZ', 'teacher'),
      ('Prof. Emily Johnson', 'prof.johnson', 'emily.johnson@nexus.edu', '$2b$10$XYZ', 'teacher'),
      ('Dr. Michael Williams', 'dr.williams', 'michael.williams@nexus.edu', '$2b$10$XYZ', 'teacher'),
      ('Prof. Jennifer Davis', 'prof.davis', 'jennifer.davis@nexus.edu', '$2b$10$XYZ', 'teacher'),
      ('Dr. Carlos Garcia', 'dr.garcia', 'carlos.garcia@nexus.edu', '$2b$10$XYZ', 'teacher'),
      ('Prof. Maria Martinez', 'prof.martinez', 'maria.martinez@nexus.edu', '$2b$10$XYZ', 'teacher'),
      ('Dr. James Anderson', 'dr.anderson', 'james.anderson@nexus.edu', '$2b$10$XYZ', 'teacher'),
      ('Prof. Patricia Taylor', 'prof.taylor', 'patricia.taylor@nexus.edu', '$2b$10$XYZ', 'teacher'),
      ('Dr. David Lee', 'dr.lee', 'david.lee@nexus.edu', '$2b$10$XYZ', 'teacher'),
      ('Prof. Linda Wang', 'prof.wang', 'linda.wang@nexus.edu', '$2b$10$XYZ', 'teacher'),
      ('Dr. Robert Taylor', 'dr.taylor', 'robert.taylor@nexus.edu', '$2b$10$XYZ', 'teacher'),
      ('Prof. Patricia Anderson', 'prof.anderson2', 'patricia.anderson@nexus.edu', '$2b$10$XYZ', 'teacher')
      ON CONFLICT (username) DO NOTHING
    `);
        console.log('   ✓ Staff users imported\n');

        // Batch 2: Departments
        console.log('📝 Batch 2/8: Importing departments...');
        await client.query(`
      INSERT INTO departments (code, name, description, budget_allocation) VALUES
      ('CS', 'Computer Science', 'Computer Science Department', 500000),
      ('MATH', 'Mathematics', 'Mathematics Department', 400000),
      ('SCI', 'Natural Sciences', 'Science Department', 450000),
      ('ENG', 'English', 'English Department', 300000),
      ('ARTS', 'Arts', 'Arts Department', 280000),
      ('PE', 'Physical Education', 'PE Department', 200000)
      ON CONFLICT (code) DO NOTHING
    `);
        console.log('   ✓ Departments imported\n');

        // Batch 3: Programs
        console.log('📝 Batch 3/8: Importing programs...');
        const depts = await client.query('SELECT id, code FROM departments LIMIT 6');
        const deptMap = {};
        depts.rows.forEach(r => deptMap[r.code] = r.id);

        if (deptMap['CS']) {
            await client.query(`
        INSERT INTO programs (department_id, name, code, level, duration_years, total_credits) VALUES
        ($1, 'Computer Science Track', 'CS-TRACK', 'undergraduate', 4, 120),
        ($2, 'Pure Mathematics', 'PMATH', 'undergraduate', 4, 120),
        ($3, 'Biology Track', 'BIO', 'undergraduate', 4, 120)
        ON CONFLICT DO NOTHING
      `, [deptMap['CS'], deptMap['MATH'], deptMap['SCI']]);
        }
        console.log('   ✓ Programs imported\n');

        // Batch 4: Parents (20 parents)
        console.log('📝 Batch 4/8: Importing parents (20)...');
        const parentInserts = [];
        for (let i = 1; i <= 20; i++) {
            parentInserts.push(`('Parent ${i}', '555-${1000 + i}', 'parent${i}@email.com', 'Occupation ${i}', '${i} Main Street')`);
        }
        await client.query(`
      INSERT INTO parents (name, phone, email, occupation, address) VALUES
      ${parentInserts.join(',\n')}
      ON CONFLICT DO NOTHING
    `);
        console.log('   ✓ Parents imported\n');

        // Batch 5: Classes (10 classes)
        console.log('📝 Batch 5/8: Importing classes...');
        const teacherIds = await client.query("SELECT id FROM users WHERE role='teacher' ORDER BY id LIMIT 10");
        if (teacherIds.rows.length >= 10) {
            const classInserts = [
                `('Grade 8', 'A', ${teacherIds.rows[0].id}, '2024-2025')`,
                `('Grade 8', 'B', ${teacherIds.rows[1].id}, '2024-2025')`,
                `('Grade 9', 'A', ${teacherIds.rows[2].id}, '2024-2025')`,
                `('Grade 9', 'B', ${teacherIds.rows[3].id}, '2024-2025')`,
                `('Grade 10', 'A', ${teacherIds.rows[4].id}, '2024-2025')`,
                `('Grade 10', 'B', ${teacherIds.rows[5].id}, '2024-2025')`,
                `('Grade 11', 'A', ${teacherIds.rows[6].id}, '2024-2025')`,
                `('Grade 11', 'B', ${teacherIds.rows[7].id}, '2024-2025')`,
                `('Grade 12', 'A', ${teacherIds.rows[8].id}, '2024-2025')`,
                `('Grade 12', 'B', ${teacherIds.rows[9].id}, '2024-2025')`
            ];
            await client.query(`
        INSERT INTO classes (name, section, teacher_id, academic_year) VALUES
        ${classInserts.join(',\n')}
        ON CONFLICT DO NOTHING
      `);
        }
        console.log('   ✓ Classes imported\n');

        // Batch 6: Student Users (20 students)
        console.log('📝 Batch 6/8: Importing student users (20)...');
        const studentUserInserts = [];
        for (let i = 1; i <= 20; i++) {
            studentUserInserts.push(`('Student ${i}', 'student${i}', 'student${i}@nexus.edu', '$2b$10$XYZ', 'student')`);
        }
        await client.query(`
      INSERT INTO users (name, username, email, password, role) VALUES
      ${studentUserInserts.join(',\n')}
      ON CONFLICT (username) DO NOTHING
    `);
        console.log('   ✓ Student users imported\n');

        // Batch 7: Student Records (20 students)
        console.log('📝 Batch 7/8: Importing student records (20)...');
        const studentUsers = await client.query("SELECT id, username FROM users WHERE role='student' ORDER BY id LIMIT 20");
        const classes = await client.query('SELECT id, name, section FROM classes ORDER BY id LIMIT 10');
        const parents = await client.query('SELECT id FROM parents ORDER BY id LIMIT 20');

        if (studentUsers.rows.length >= 20 && classes.rows.length >= 1 && parents.rows.length >= 20) {
            const studentInserts = [];
            for (let i = 0; i < 20; i++) {
                const classId = classes.rows[i % classes.rows.length].id;
                const parentId = parents.rows[i].id;
                const userId = studentUsers.rows[i].id;
                const admNo = `ADM2024${String(i + 1).padStart(3, '0')}`;
                studentInserts.push(`(${userId}, '${admNo}', ${classId}, '2010-01-01', 'male', '555-${2000 + i}', '${i + 1} School St', ${parentId}, 'active')`);
            }

            await client.query(`
        INSERT INTO students (user_id, admission_no, class_id, dob, gender, phone, address, parent_id, status) VALUES
        ${studentInserts.join(',\n')}
        ON CONFLICT (admission_no) DO NOTHING
      `);
        }
        console.log('   ✓ Student records imported\n');

        // Batch 8: Academic Years & Semesters
        console.log('📝 Batch 8/8: Importing academic data...');
        await client.query(`
      INSERT INTO academic_years (year_code, start_date, end_date, is_active) VALUES
      ('2024-2025', '2024-09-01', '2025-06-30', true)
      ON CONFLICT DO NOTHING
    `);

        const ayResult = await client.query("SELECT id FROM academic_years WHERE year_code='2024-2025'");
        if (ayResult.rows.length > 0) {
            await client.query(`
        INSERT INTO semesters (academic_year_id, name, semester_number, start_date, end_date, is_active) VALUES
        (${ayResult.rows[0].id}, 'Spring 2025', 2, '2025-01-10', '2025-05-25', true)
        ON CONFLICT DO NOTHING
      `);
        }
        console.log('   ✓ Academic data imported\n');

        console.log('\n✅ Batch import completed successfully!\n');

        // Show summary
        const counts = await Promise.all([
            client.query('SELECT COUNT(*) FROM users'),
            client.query('SELECT COUNT(*) FROM students'),
            client.query('SELECT COUNT(*) FROM parents'),
            client.query('SELECT COUNT(*) FROM classes'),
            client.query('SELECT COUNT(*) FROM departments'),
            client.query('SELECT COUNT(*) FROM programs'),
        ]);

        console.log('📊 Final Database Summary:');
        console.log(`   👤 Users: ${counts[0].rows[0].count}`);
        console.log(`   🎓 Students: ${counts[1].rows[0].count}`);
        console.log(`   👨‍👩‍👧 Parents: ${counts[2].rows[0].count}`);
        console.log(`   🏫 Classes: ${counts[3].rows[0].count}`);
        console.log(`   🏢 Departments: ${counts[4].rows[0].count}`);
        console.log(`   📚 Programs: ${counts[5].rows[0].count}\n`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Details:', error.detail || 'No additional details');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

batchImport().catch(console.error);
