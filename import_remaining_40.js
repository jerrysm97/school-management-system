#!/usr/bin/env node
/**
 * Import remaining 40 students (11-50) to reach 50 total
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function importRemaining40() {
    const client = await pool.connect();

    try {
        console.log('🚀 Importing remaining 40 students (11-50)...\n');

        await client.query('BEGIN');

        // Student names 11-50
        const studentNames = [
            'Mia Taylor', 'Logan Anderson', 'Charlotte Thomas', 'Jackson Moore', 'Amelia Martin',
            'Aiden Jackson', 'Harper White', 'Elijah Harris', 'Evelyn Clark', 'Alexander Lewis',
            'Abigail Walker', 'Benjamin Hall', 'Emily Allen', 'James Young', 'Elizabeth King',
            'Michael Wright', 'Sofia Lopez', 'William Hill', 'Avery Scott', 'Daniel Green',
            'Grace Adams', 'Henry Baker', 'Chloe Gonzalez', 'Sebastian Nelson', 'Scarlett Carter',
            'Jack Mitchell', 'Luna Perez', 'Owen Roberts', 'Zoey Turner', 'Wyatt Phillips',
            'Lily Campbell', 'Grayson Parker', 'Aria Evans', 'Carter Edwards', 'Penelope Collins',
            'Luke Stewart', 'Riley Sanchez', 'Nora Morris', 'Julian Rogers', 'Hannah Reed'
        ];

        // Create student user accounts (11-50)
        console.log('📝 Step 1: Creating student user accounts (11-50)...');
        const userInserts = [];
        for (let i = 0; i < 40; i++) {
            const num = i + 11;
            userInserts.push(`('${studentNames[i]}', 'student_${num}', 'student${num}@nexus.edu', '$2b$10$XYZ', 'student')`);
        }

        await client.query(`
      INSERT INTO users (name, username, email, password, role) VALUES
      ${userInserts.join(',\n')}
      ON CONFLICT (username) DO NOTHING
    `);
        console.log('   ✓ Student users created\n');

        // Get classes and parents
        const classes = await client.query('SELECT id FROM classes ORDER BY id LIMIT 10');
        const parents = await client.query('SELECT id FROM parents ORDER BY id LIMIT 50');
        const studentUsers = await client.query("SELECT id FROM users WHERE username LIKE 'student_%' AND username NOT IN (SELECT username FROM users u JOIN students s ON u.id = s.user_id) ORDER BY username");

        console.log('📝 Step 2: Creating student records...');

        if (studentUsers.rows.length > 0 && classes.rows.length >= 1 && parents.rows.length >= 40) {
            const studentInserts = [];

            for (let i = 0; i < Math.min(40, studentUsers.rows.length); i++) {
                const userId = studentUsers.rows[i].id;
                const classId = classes.rows[i % classes.rows.length].id;
                const parentId = parents.rows[(i + 10) % parents.rows.length].id;
                const admNo = `ADM2024${String(i + 11).padStart(3, '0')}`;
                const gender = i % 2 === 0 ? 'female' : 'male';
                const month = String(((i + 10) % 12) + 1).padStart(2, '0');

                studentInserts.push(`(${userId}, '${admNo}', ${classId}, '2010-${month}-15', '${gender}', '555-${2011 + i}', '${i + 11} Student Street', ${parentId}, 'approved')`);
            }

            if (studentInserts.length > 0) {
                await client.query(`
          INSERT INTO students (user_id, admission_no, class_id, dob, gender, phone, address, parent_id, status) VALUES
          ${studentInserts.join(',\n')}
          ON CONFLICT (admission_no) DO NOTHING
        `);
            }
        }

        await client.query('COMMIT');
        console.log('   ✓ Student records created\n');

        // Final counts
        const counts = await Promise.all([
            client.query("SELECT COUNT(*) FROM users WHERE username LIKE 'student_%'"),
            client.query('SELECT COUNT(*) FROM students'),
            client.query("SELECT COUNT(*) FROM students WHERE admission_no LIKE 'ADM2024%'"),
        ]);

        console.log('\n✅ Import Complete!\n');
        console.log('📊 Updated Summary:');
        console.log(`   Student user accounts (student_*): ${counts[0].rows[0].count}`);
        console.log(`   Total student records: ${counts[1].rows[0].count}`);
        console.log(`   Students with ADM2024* numbers: ${counts[2].rows[0].count}\n`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

importRemaining40().catch(console.error);
