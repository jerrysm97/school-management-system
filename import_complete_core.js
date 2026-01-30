#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function importCore() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Core data already imported!\n');
    console.log('   Creating attendance records...\n');
    
    await client.query('BEGIN');
    
    // Attendance for 20 students
    console.log('📅 Creating attendance records for January 2025...');
    const students = await client.query('SELECT id FROM students ORDER BY id LIMIT 20');
    const statuses = ['present', 'absent', 'late'];
    
    for (let day = 20; day <= 30; day++) {
      const date = `2025-01-${String(day).padStart(2, '0')}`;
      
      for (const student of students.rows) {
        const status = statuses[Math.floor(Math.random() * 10) < 8 ? 0 : (Math.random() < 0.7 ? 2 : 1)];
        
        await client.query(`
          INSERT INTO attendance (student_id, date, status)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [student.id, date, status]);
      }
    }
    
    await client.query('COMMIT');
    console.log('   ✓ Attendance created\n');
    
    // Final Summary
    const counts = await Promise.all([
      client.query('SELECT COUNT(*) FROM users'),
      client.query('SELECT COUNT(*) FROM students'),
      client.query('SELECT COUNT(*) FROM parents'),
      client.query('SELECT COUNT(*) FROM classes'),
      client.query('SELECT COUNT(*) FROM attendance'),
    ]);

    console.log('\n📊 FINAL DATABASE SUMMARY:');
    console.log(`   👤 Total Users: ${counts[0].rows[0].count}`);
    console.log(`   🎓 Students: ${counts[1].rows[0].count}`);
    console.log(`   👨‍👩‍👧 Parents: ${counts[2].rows[0].count}`);
    console.log(`   🏫 Classes: ${counts[3].rows[0].count}`);
    console.log(`   📅 Attendance: ${counts[4].rows[0].count}\n`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

importCore().catch(console.error);
