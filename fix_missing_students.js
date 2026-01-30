#!/usr/bin/env node
/**
 * Fix: Create student records for all 50 student users
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createMissingStudents() {
    const client = await pool.connect();

    try {
        console.log('🔧 Creating student records for all users without them...\n');

        await client.query('BEGIN');

        // Get all student users without student records
        const orphanedUsers = await client.query(`
      SELECT u.id, u.username
      FROM users u
      WHERE u.username LIKE 'student_%'
      AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id)
      ORDER BY u.username
    `);

        console.log(`Found ${orphanedUsers.rows.length} users needing student records\n`);

        if (orphanedUsers.rows.length === 0) {
            console.log('✓ All student users already have student records!\n');
            await client.query('COMMIT');
            client.release();
            await pool.end();
            return;
        }

        // Get classes and parents
        const classes = await client.query('SELECT id FROM classes ORDER BY id');
        const parents = await client.query('SELECT id FROM parents ORDER BY id LIMIT 50');

        console.log(`Available: ${classes.rows.length} classes, ${parents.rows.length} parents\n`);

        // Create student records for each orphaned user
        for (let i = 0; i < orphanedUsers.rows.length; i++) {
            const user = orphanedUsers.rows[i];
            const studentNum = parseInt(user.username.replace('student_', ''));

            const classId = classes.rows[i % classes.rows.length].id;
            const parentId = parents.rows[i % parents.rows.length].id;
            const admNo = `ADM2024${String(studentNum).padStart(3, '0')}`;
            const gender = studentNum % 2 === 0 ? 'female' : 'male';
            const month = String((studentNum % 12) + 1).padStart(2, '0');

            await client.query(`
        INSERT INTO students (user_id, admission_no, class_id, dob, gender, phone, address, parent_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved')
        ON CONFLICT (admission_no) DO NOTHING
      `, [user.id, admNo, classId, `2010-${month}-15`, gender, `555-${2000 + studentNum}`, `${studentNum} Student Street`, parentId]);

            if ((i + 1) % 10 === 0) {
                console.log(`  Progress: ${i + 1}/${orphanedUsers.rows.length} students created`);
            }
        }

        await client.query('COMMIT');
        console.log(`\n✅ Created ${orphanedUsers.rows.length} student records!\n`);

        // Final verification
        const finalCounts = await Promise.all([
            client.query("SELECT COUNT(*) FROM users WHERE username LIKE 'student_%'"),
            client.query('SELECT COUNT(*) FROM students'),
        ]);

        console.log('📊 Final Counts:');
        console.log(`   Student users: ${finalCounts[0].rows[0].count}`);
        console.log(`   Student records: ${finalCounts[1].rows[0].count}\n`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createMissingStudents().catch(console.error);
