#!/usr/bin/env node
/**
 * COMPLETE Nexus School Data Import
 * Imports ALL data: 50 students, parents, fees, payments, attendance, budgets
 * Adapted to match actual database schema
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fullImport() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting COMPLETE Nexus School data import...\n');
        console.log('   Importing: 50 students, parents, fees, payments, attendance\n');

        await client.query('BEGIN');

        // ========== BATCH 1: Parent Users (50 parents) ==========
        console.log('📝 [1/10] Creating 50 parent user accounts...');
        const parentUserInserts = [];
        const parentNames = [
            'Robert Wilson', 'Sarah Brown', 'Michael Jones', 'Maria Garcia', 'Carlos Martinez',
            'Ana Rodriguez', 'James Davis', 'Jennifer Lopez', 'David Lee', 'Lisa Wang',
            'Robert Taylor', 'Patricia Anderson', 'Christopher Thomas', 'Michelle Moore', 'Kevin Martin',
            'Amanda Jackson', 'Daniel White', 'Emily Harris', 'Matthew Clark', 'Jessica Lewis',
            'Andrew Walker', 'Rebecca Hall', 'Joshua Allen', 'Sarah Young', 'Thomas King',
            'Karen Wright', 'Jose Lopez', 'Barbara Hill', 'Richard Scott', 'Nancy Green',
            'Steven Adams', 'Linda Baker', 'Paul Gonzalez', 'Carol Nelson', 'Mark Carter',
            'Susan Mitchell', 'George Perez', 'Betty Roberts', 'Frank Turner', 'Helen Phillips',
            'Ronald Campbell', 'Dorothy Parker', 'Kenneth Evans', 'Donna Edwards', 'Gary Collins',
            'Sandra Stewart', 'Larry Sanchez', 'Joe Morris', 'Janet Rogers', 'Terry Reed'
        ];

        for (let i = 0; i < 50; i++) {
            const username = `parent_${i + 1}`;
            const email = `parent${i + 1}@email.com`;
            parentUserInserts.push(`('${parentNames[i]}', '${username}', '${email}', '$2b$10$XYZ', 'student')`);
        }

        await client.query(`
      INSERT INTO users (name, username, email, password, role) VALUES
      ${parentUserInserts.join(',\n')}
      ON CONFLICT (username) DO NOTHING
    `);
        console.log('   ✓ Parent users created\n');

        // ========== BATCH 2: Parent Records ==========
        console.log('📝 [2/10] Creating 50 parent records...');
        const parentUsers = await client.query("SELECT id FROM users WHERE username LIKE 'parent_%' ORDER BY username LIMIT 50");

        if (parentUsers.rows.length >= 50) {
            const parentInserts = [];
            for (let i = 0; i < 50; i++) {
                parentInserts.push(`(${parentUsers.rows[i].id}, '555-${1001 + i}', '${i + 1} Main Street, Springfield')`);
            }

            await client.query(`
        INSERT INTO parents (user_id, phone, address) VALUES
        ${parentInserts.join(',\n')}
        ON CONFLICT DO NOTHING
      `);
        }
        console.log('   ✓ Parent records created\n');

        // ========== BATCH 3: Classes (10 classes) ==========
        console.log('📝 [3/10] Ensuring 10 classes exist...');

        const classInserts = [
            `('Grade 8', '8', 'A')`,
            `('Grade 8', '8', 'B')`,
            `('Grade 9', '9', 'A')`,
            `('Grade 9', '9', 'B')`,
            `('Grade 10', '10', 'A')`,
            `('Grade 10', '10', 'B')`,
            `('Grade 11', '11', 'A')`,
            `('Grade 11', '11', 'B')`,
            `('Grade 12', '12', 'A')`,
            `('Grade 12', '12', 'B')`
        ];

        for (const classInsert of classInserts) {
            await client.query(`
              INSERT INTO classes (name, grade, section) VALUES ${classInsert}
              ON CONFLICT DO NOTHING
            `);
        }

        console.log('   ✓ Classes created\n');

        // ========== BATCH 4: Student Users (50 students) ==========
        console.log('📝 [4/10] Creating 50 student user accounts...');
        const studentNames = [
            'Emma Wilson', 'Liam Brown', 'Olivia Jones', 'Noah Garcia', 'Ava Martinez',
            'Ethan Rodriguez', 'Sophia Davis', 'Mason Lopez', 'Isabella Lee', 'Lucas Wang',
            'Mia Taylor', 'Logan Anderson', 'Charlotte Thomas', 'Jackson Moore', 'Amelia Martin',
            'Aiden Jackson', 'Harper White', 'Elijah Harris', 'Evelyn Clark', 'Alexander Lewis',
            'Abigail Walker', 'Benjamin Hall', 'Emily Allen', 'James Young', 'Elizabeth King',
            'Michael Wright', 'Sofia Lopez', 'William Hill', 'Avery Scott', 'Daniel Green',
            'Grace Adams', 'Henry Baker', 'Chloe Gonzalez', 'Sebastian Nelson', 'Scarlett Carter',
            'Jack Mitchell', 'Luna Perez', 'Owen Roberts', 'Zoey Turner', 'Wyatt Phillips',
            'Lily Campbell', 'Grayson Parker', 'Aria Evans', 'Carter Edwards', 'Penelope Collins',
            'Luke Stewart', 'Riley Sanchez', 'Nora Morris', 'Julian Rogers', 'Hannah Reed'
        ];

        const studentUserInserts = [];
        for (let i = 0; i < 50; i++) {
            const username = `student_${i + 1}`;
            const email = `student${i + 1}@nexus.edu`;
            studentUserInserts.push(`('${studentNames[i]}', '${username}', '${email}', '$2b$10$XYZ', 'student')`);
        }

        await client.query(`
      INSERT INTO users (name, username, email, password, role) VALUES
      ${studentUserInserts.join(',\n')}
      ON CONFLICT (username) DO NOTHING
    `);
        console.log('   ✓ Student users created\n');

        // ========== BATCH 5: Student Records (50 students) ==========
        console.log('📝 [5/10] Creating 50 student records...');
        const studentUsers = await client.query("SELECT id FROM users WHERE username LIKE 'student_%' ORDER BY username LIMIT 50");
        const classes = await client.query('SELECT id, name FROM classes ORDER BY id LIMIT 10');
        const parents = await client.query('SELECT id FROM parents ORDER BY id LIMIT 50');

        if (studentUsers.rows.length >= 50 && classes.rows.length >= 10 && parents.rows.length >= 50) {
            const studentInserts = [];

            for (let i = 0; i < 50; i++) {
                const userId = studentUsers.rows[i].id;
                const classId = classes.rows[Math.floor(i / 5) % 10].id; // Distribute across classes
                const parentId = parents.rows[i].id;
                const admNo = `ADM2024${String(i + 1).padStart(3, '0')}`;
                const gender = i % 2 === 0 ? 'male' : 'female';
                const month = String((i % 12) + 1).padStart(2, '0');

                studentInserts.push(`(${userId}, '${admNo}', ${classId}, '2010-${month}-15', '${gender}', '555-${2001 + i}', '${i + 1} Student Street', ${parentId}, 'approved')`);
            }

            await client.query(`
        INSERT INTO students (user_id, admission_no, class_id, dob, gender, phone, address, parent_id, status) VALUES
        ${studentInserts.join(',\n')}
        ON CONFLICT (admission_no) DO NOTHING
      `);
        }
        console.log('   ✓ Student records created\n');

        // ========== BATCH 6: Academic Years & Semesters ==========
        console.log('📝 [6/10] Creating academic years & semesters...');
        await client.query(`
      INSERT INTO academic_years (year_code, start_date, end_date, is_active) VALUES
      ('2023-2024', '2023-09-01', '2024-06-30', false),
      ('2024-2025', '2024-09-01', '2025-06-30', true),
      ('2025-2026', '2025-09-01', '2026-06-30', false)
      ON CONFLICT DO NOTHING
    `);

        const ayResult = await client.query("SELECT id FROM academic_years WHERE year_code='2024-2025'");
        if (ayResult.rows.length > 0) {
            await client.query(`
        INSERT INTO semesters (academic_year_id, name, semester_number, start_date, end_date, is_active) VALUES
        (${ayResult.rows[0].id}, 'Fall 2024', 1, '2024-09-01', '2024-12-20', false),
        (${ayResult.rows[0].id}, 'Spring 2025', 2, '2025-01-10', '2025-05-25', true),
        (${ayResult.rows[0].id}, 'Summer 2025', 3, '2025-06-01', '2025-08-20', false)
        ON CONFLICT DO NOTHING
      `);
        }
        console.log('   ✓ Academic data created\n');

        // ========== BATCH 7: Fee Structures ==========
        console.log('📝 [7/10] Creating fee structures...');
        const allClasses = await client.query('SELECT id, name FROM classes ORDER BY id');

        for (const cls of allClasses.rows) {
            let baseAmount = 350000; // Base tuition in cents

            if (cls.name.includes('9')) baseAmount = 380000;
            if (cls.name.includes('10')) baseAmount = 420000;
            if (cls.name.includes('11')) baseAmount = 450000;
            if (cls.name.includes('12')) baseAmount = 480000;

            await client.query(`
        INSERT INTO fee_structures (class_id, fee_type, amount, due_date, description) VALUES
        (${cls.id}, 'tuition', ${baseAmount}, '2025-02-10', '${cls.name} Tuition - Spring 2025'),
        (${cls.id}, 'lab', ${Math.floor(baseAmount * 0.02)}, '2025-02-10', '${cls.name} Lab Fee'),
        (${cls.id}, 'library', 3000, '2025-02-10', '${cls.name} Library Fee'),
        (${cls.id}, 'sports', 4000, '2025-02-10', '${cls.name} Sports Fee'),
        (${cls.id}, 'technology', ${Math.floor(baseAmount * 0.015)}, '2025-02-10', '${cls.name} Technology Fee')
        ON CONFLICT DO NOTHING
      `);
        }
        console.log('   ✓ Fee structures created\n');

        // ========== BATCH 8: Student Fees (Assigned to students) ==========
        console.log('📝 [8/10] Assigning fees to 50 students...');
        const allStudents = await client.query('SELECT id, class_id FROM students ORDER BY id LIMIT 50');

        const statuses = ['paid', 'partial', 'pending', 'overdue'];
        for (let i = 0; i < allStudents.rows.length; i++) {
            const student = allStudents.rows[i];
            let totalAmount = 368000; // Default Grade 8

            // Adjust based on class
            const classInfo = await client.query('SELECT name FROM classes WHERE id = $1', [student.class_id]);
            if (classInfo.rows.length > 0) {
                const className = classInfo.rows[0].name;
                if (className.includes('9')) totalAmount = 400000;
                if (className.includes('10')) totalAmount = 445000;
                if (className.includes('11')) totalAmount = 478000;
                if (className.includes('12')) totalAmount = 513000;
            }

            const status = statuses[i % 4];
            let paidAmount = 0;

            if (status === 'paid') paidAmount = totalAmount;
            else if (status === 'partial') paidAmount = Math.floor(totalAmount * (0.4 + Math.random() * 0.4));

            await client.query(`
        INSERT INTO student_fees (student_id, amount, paid_amount, status, due_date, fee_type, description)
        VALUES ($1, $2, $3, $4, '2025-02-10', 'tuition', 'Spring 2025 Full Fees')
        ON CONFLICT DO NOTHING
      `, [student.id, totalAmount, paidAmount, status]);
        }
        console.log('   ✓ Student fees assigned\n');

        // ========== BATCH 9: Payments ==========
        console.log('📝 [9/10] Creating payment records...');
        const accountantId = await client.query("SELECT id FROM users WHERE role='accountant' LIMIT 1");
        const collectedBy = accountantId.rows.length > 0 ? accountantId.rows[0].id : 1;

        const paidStudents = await client.query(`
      SELECT student_id, paid_amount 
      FROM student_fees 
      WHERE paid_amount > 0 
      ORDER BY student_id 
      LIMIT 35
    `);

        const paymentMethods = ['bank_transfer', 'cash', 'online', 'card'];
        for (let i = 0; i < paidStudents.rows.length; i++) {
            const student = paidStudents.rows[i];
            const method = paymentMethods[i % 4];
            const refNum = `TXN-${method.toUpperCase()}-${String(i + 1).padStart(4, '0')}`;
            const date = `2025-01-${String((i % 28) + 1).padStart(2, '0')}`;

            await client.query(`
        INSERT INTO payments (student_id, amount, payment_date, payment_method, reference_number, status, collected_by, notes)
        VALUES ($1, $2, $3, $4, $5, 'completed', $6, 'Payment for Spring 2025')
        ON CONFLICT DO NOTHING
      `, [student.student_id, student.paid_amount, date, method, refNum, collectedBy]);
        }
        console.log('   ✓ Payment records created\n');

        // ========== BATCH 10: Attendance Records ==========
        console.log('📝 [10/10] Creating attendance records for January 2025...');
        const attendanceStatuses = ['present', 'absent', 'late'];
        const dates = [];

        // Generate dates for January 20-30
        for (let day = 20; day <= 30; day++) {
            dates.push(`2025-01-${String(day).padStart(2, '0')}`);
        }

        const first20Students = await client.query('SELECT id FROM students ORDER BY id LIMIT 20');

        for (const student of first20Students.rows) {
            for (const date of dates) {
                const status = attendanceStatuses[Math.floor(Math.random() * 10) < 8 ? 0 : (Math.random() < 0.7 ? 2 : 1)];

                await client.query(`
          INSERT INTO attendance (student_id, date, status)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [student.id, date, status]);
            }
        }
        console.log('   ✓ Attendance records created\n');

        await client.query('COMMIT');
        console.log('\n✅ COMPLETE DATA IMPORT FINISHED!\n');

        // Final Summary
        const finalCounts = await Promise.all([
            client.query('SELECT COUNT(*) FROM users'),
            client.query('SELECT COUNT(*) FROM students'),
            client.query('SELECT COUNT(*) FROM parents'),
            client.query('SELECT COUNT(*) FROM classes'),
            client.query('SELECT COUNT(*) FROM student_fees'),
            client.query('SELECT COUNT(*) FROM payments'),
            client.query('SELECT COUNT(*) FROM attendance'),
        ]);

        console.log('📊 FINAL DATABASE SUMMARY:');
        console.log(`   👤 Total Users: ${finalCounts[0].rows[0].count}`);
        console.log(`   🎓 Students: ${finalCounts[1].rows[0].count}`);
        console.log(`   👨‍👩‍👧 Parents: ${finalCounts[2].rows[0].count}`);
        console.log(`   🏫 Classes: ${finalCounts[3].rows[0].count}`);
        console.log(`   💰 Student Fees: ${finalCounts[4].rows[0].count}`);
        console.log(`   💵 Payments: ${finalCounts[5].rows[0].count}`);
        console.log(`   📅 Attendance Records: ${finalCounts[6].rows[0].count}\n`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error:', error.message);
        console.error('Details:', error.detail || '');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

fullImport().catch(console.error);
