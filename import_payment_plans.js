#!/usr/bin/env node
/**
 * Import Payment Plans Script
 * Seeds payment plans and installments for students
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function importPaymentPlans() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting Payment Plans import...\n');
        await client.query('BEGIN');

        // 1. Get 10 students (join with users for names)
        console.log('📝 Fetching students...');
        const students = await client.query(`
      SELECT s.id, u.name as student_name, s.admission_no 
      FROM students s
      JOIN users u ON s.user_id = u.id
      LIMIT 10
    `);

        if (students.rows.length === 0) {
            console.log('⚠️ No students found. Please run import_full_nexus.js first.');
            return;
        }

        console.log(`   Found ${students.rows.length} students to assign plans to.\n`);

        // 2. Create Payment Plans
        console.log('📝 Creating Payment Plans...');
        for (const student of students.rows) {
            const totalAmount = 400000; // 4000.00
            const planRes = await client.query(`
        INSERT INTO payment_plans (student_id, total_amount, start_date, end_date, frequency, status, notes)
        VALUES ($1, $2, '2025-01-01', '2025-04-01', 'monthly', 'active', 'Spring 2025 Tuition Plan')
        RETURNING id
      `, [student.id, totalAmount]);

            const planId = planRes.rows[0].id;

            // 3. Create Installments (4 installments of 1000.00)
            const installmentAmount = 100000;
            await client.query(`
        INSERT INTO payment_plan_installments (payment_plan_id, due_date, amount, status, paid_amount)
        VALUES 
        ($1, '2025-01-05', $2, 'paid', $2),
        ($1, '2025-02-05', $2, 'pending', 0),
        ($1, '2025-03-05', $2, 'pending', 0),
        ($1, '2025-04-05', $2, 'pending', 0)
      `, [planId, installmentAmount]);
        }

        await client.query('COMMIT');
        console.log(`\n✅ Successfully created payment plans for ${students.rows.length} students.`);

        // Summary
        const counts = await Promise.all([
            client.query('SELECT COUNT(*) FROM payment_plans'),
            client.query('SELECT COUNT(*) FROM payment_plan_installments')
        ]);

        console.log('📊 Summary:');
        console.log(`   Payment Plans: ${counts[0].rows[0].count}`);
        console.log(`   Installments: ${counts[1].rows[0].count}\n`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

importPaymentPlans().catch(console.error);
