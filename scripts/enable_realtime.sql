-- ========================================
-- SUPABASE REALTIME CONFIGURATION
-- ========================================
-- Run this script in Supabase SQL Editor to enable realtime subscriptions

-- Enable Realtime for Core Tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE student_fees;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE courses;
ALTER PUBLICATION supabase_realtime ADD TABLE course_enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================
-- Enable RLS on all tables

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- ========================================
-- BASE RLS POLICIES
-- ========================================

-- Users: Users can read their own record
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = auth_id);

-- Users: Admins can read all users
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_id = auth.uid()
    AND u.role IN ('main_admin', 'admin', 'principal')
  )
);

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

-- Students: Students can view their own record
CREATE POLICY "Students can view own profile"
ON students FOR SELECT
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

-- Students: Parents can view their children
CREATE POLICY "Parents can view their children"
ON students FOR SELECT
USING (
  parent_id IN (
    SELECT p.id FROM parents p
    JOIN users u ON p.user_id = u.id
    WHERE u.auth_id = auth.uid()
  )
);

-- Teachers: Teachers can view students in their classes
CREATE POLICY "Teachers can view class students"
ON students FOR SELECT
USING (
  class_id IN (
    SELECT c.id FROM classes c
    WHERE c.class_teacher_id IN (
      SELECT t.id FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  )
);

-- Attendance: Students can view their own attendance
CREATE POLICY "Students can view own attendance"
ON attendance FOR SELECT
USING (
  student_id IN (
    SELECT s.id FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE u.auth_id = auth.uid()
  )
);

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid()
    AND role IN ('main_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM users WHERE auth_id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM users WHERE auth_id = auth.uid();
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
