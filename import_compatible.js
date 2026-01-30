#!/usr/bin/env node
/**
 * Compatible Batch Import - Matches ACTUAL Schema
 * Parents link to users via user_id, not direct name field
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function compatibleImport() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting schema-compatible import...\n');

        // Batch 1: Parent Users (create user accounts for parents)
        console.log('📝 Batch 1/4: Creating parent user accounts (10)...');
        const parentUserInserts = [];
        for (let i = 1; i <= 10; i++) {
            parentUserInserts.push(`('Parent User ${i}', 'parent${i}', 'parent${i}@email.com', '$2b$10$XYZ', 'student')`); // Using 'student' role for parents
        }
        await client.query(`
      INSERT INTO users (name, username, email, password, role) VALUES
      ${parentUserInserts.join(',\n')}
      ON CONFLICT (username) DO NOTHING
    `);
        console.log('   ✓ Parent users created\n');

        // Batch 2: Parent Records (link to user_id)
        console.log('📝 Batch 2/4: Creating parent records...');
        const parentUsers = await client.query("SELECT id FROM users WHERE username LIKE 'parent%' ORDER BY id LIMIT 10");

        if (parentUsers.rows.length >= 10) {
            const parentInserts = [];
            for (let i = 0; i < 10; i++) {
                parentInserts.push(`(${parentUsers.rows[i].id}, '555-${1000 + i}', '${i + 1} Parent Street')`);
            }

            await client.query(`
        INSERT INTO parents (user_id, phone, address) VALUES
        ${parentInserts.join(',\n')}
        ON CONFLICT DO NOTHING
      `);
        }
        console.log('   ✓ Parent records created\n');

        // Batch 3: Student Users (10 students)
        console.log('📝 Batch 3/4: Creating student users (10)...');
        const studentUserInserts = [];
        for (let i = 1; i <= 10; i++) {
            studentUserInserts.push(`('Student ${i}', 'student${i}', 'student${i}@nexus.edu', '$2b$10$XYZ', 'student')`);
        }
        await client.query(`
      INSERT INTO users (name, username, email, password, role) VALUES
      ${studentUserInserts.join(',\n')}
      ON CONFLICT (username) DO NOTHING
    `);
        console.log('   ✓ Student users created\n');

        // Batch 4: Student Records
        console.log('📝 Batch 4/4: Creating student records (10)...');
        const studentUsers = await client.query("SELECT id FROM users WHERE username LIKE 'student%' ORDER BY id LIMIT 10");
        const classes = await client.query('SELECT id FROM classes ORDER BY id LIMIT 1');
        const parents = await client.query('SELECT id FROM parents ORDER BY id LIMIT 10');

        if (studentUsers.rows.length >= 10 && classes.rows.length >= 1 && parents.rows.length >= 10) {
            const studentInserts = [];
            for (let i = 0; i < 10; i++) {
                const userId = studentUsers.rows[i].id;
                const classId = classes.rows[0].id;
                const parentId = parents.rows[i].id;
                const admNo = `ADM2024${String(i + 101).padStart(3, '0')}`;

                studentInserts.push(`(${userId}, '${admNo}', ${classId}, '2010-0${(i % 9) + 1}-15', 'male', '555-${2000 + i}', '${i + 1} Student St', ${parentId}, 'approved')`);
            }

            await client.query(`
        INSERT INTO students (user_id, admission_no, class_id, dob, gender, phone, address, parent_id, status) VALUES
        ${studentInserts.join(',\n')}
        ON CONFLICT (admission_no) DO NOTHING
      `);
        }
        console.log('   ✓ Student records created\n');

        console.log('\n✅ Compatible import completed!\n');

        // Show final summary
        const counts = await Promise.all([
            client.query('SELECT COUNT(*) FROM users'),
            client.query('SELECT COUNT(*) FROM students'),
            client.query('SELECT COUNT(*) FROM parents'),
            client.query('SELECT COUNT(*) FROM classes'),
            client.query('SELECT COUNT(*) FROM departments'),
        ]);

        console.log('📊 Final Database Summary:');
        console.log(`   👤 Total Users: ${counts[0].rows[0].count}`);
        console.log(`   🎓 Students: ${counts[1].rows[0].count}`);
        console.log(`   👨‍👩‍👧 Parents: ${counts[2].rows[0].count}`);
        console.log(`   🏫 Classes: ${counts[3].rows[0].count}`);
        console.log(`   🏢 Departments: ${counts[4].rows[0].count}\n`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

compatibleImport().catch(console.error);
