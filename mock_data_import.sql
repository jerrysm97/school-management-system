-- ============================================================================
-- COMPREHENSIVE MOCK DATA FOR UNIVERSITY FINANCE SYSTEM
-- ============================================================================

-- ============================================================================
-- 1. USERS (Admin, Accountants, Teachers)
-- ============================================================================

INSERT INTO users (username, role, password, email, full_name) VALUES
-- Admins
('admin', 'admin', '$2b$10$YourHashedPasswordHere', 'admin@university.edu', 'System Administrator'),
('john.admin', 'admin', '$2b$10$YourHashedPasswordHere', 'john.admin@university.edu', 'John Administrator'),

-- Accountants
('sarah.finance', 'accountant', '$2b$10$YourHashedPasswordHere', 'sarah.finance@university.edu', 'Sarah Finance'),
('mike.accounts', 'accountant', '$2b$10$YourHashedPasswordHere', 'mike.accounts@university.edu', 'Mike Accounts'),
('lisa.billing', 'accountant', '$2b$10$YourHashedPasswordHere', 'lisa.billing@university.edu', 'Lisa Billing'),

-- Teachers
('dr.smith', 'teacher', '$2b$10$YourHashedPasswordHere', 'dr.smith@university.edu', 'Dr. Robert Smith'),
('prof.johnson', 'teacher', '$2b$10$YourHashedPasswordHere', 'prof.johnson@university.edu', 'Prof. Emily Johnson'),
('dr.williams', 'teacher', '$2b$10$YourHashedPasswordHere', 'dr.williams@university.edu', 'Dr. Michael Williams'),
('prof.davis', 'teacher', '$2b$10$YourHashedPasswordHere', 'prof.davis@university.edu', 'Prof. Jennifer Davis'),
('dr.garcia', 'teacher', '$2b$10$YourHashedPasswordHere', 'dr.garcia@university.edu', 'Dr. Carlos Garcia'),
('prof.martinez', 'teacher', '$2b$10$YourHashedPasswordHere', 'prof.martinez@university.edu', 'Prof. Maria Martinez'),
('dr.anderson', 'teacher', '$2b$10$YourHashedPasswordHere', 'dr.anderson@university.edu', 'Dr. James Anderson'),
('prof.taylor', 'teacher', '$2b$10$YourHashedPasswordHere', 'prof.taylor@university.edu', 'Prof. Patricia Taylor'),

-- Students (for student portal access)
('student001', 'student', '$2b$10$YourHashedPasswordHere', 'emma.wilson@students.edu', 'Emma Wilson'),
('student002', 'student', '$2b$10$YourHashedPasswordHere', 'liam.brown@students.edu', 'Liam Brown'),
('student003', 'student', '$2b$10$YourHashedPasswordHere', 'olivia.jones@students.edu', 'Olivia Jones')
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- 2. DEPARTMENTS
-- ============================================================================

INSERT INTO departments (name, code, budget_allocation) VALUES
('Computer Science', 'CS', 500000.00),
('Business Administration', 'BA', 450000.00),
('Engineering', 'ENG', 600000.00),
('Medical Sciences', 'MED', 800000.00),
('Arts & Humanities', 'AH', 300000.00),
('Natural Sciences', 'NS', 550000.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. ACADEMIC PROGRAMS
-- ============================================================================

INSERT INTO programs (department_id, name, code, level, duration_years, total_credits) VALUES
-- Computer Science Programs
(1, 'Bachelor of Computer Science', 'BCS', 'undergraduate', 4, 120),
(1, 'Master of Computer Science', 'MCS', 'graduate', 2, 36),
(1, 'PhD in Computer Science', 'PHDCS', 'doctorate', 4, 60),

-- Business Programs
(2, 'Bachelor of Business Administration', 'BBA', 'undergraduate', 4, 120),
(2, 'Master of Business Administration', 'MBA', 'graduate', 2, 48),
(2, 'Bachelor of Accounting', 'BACC', 'undergraduate', 4, 120),

-- Engineering Programs
(3, 'Bachelor of Civil Engineering', 'BCE', 'undergraduate', 4, 130),
(3, 'Bachelor of Electrical Engineering', 'BEE', 'undergraduate', 4, 130),
(3, 'Master of Engineering', 'MENG', 'graduate', 2, 36),

-- Medical Programs
(4, 'Bachelor of Medicine', 'MBBS', 'undergraduate', 5, 180),
(4, 'Bachelor of Nursing', 'BN', 'undergraduate', 4, 120),

-- Arts Programs
(5, 'Bachelor of Arts in English', 'BAE', 'undergraduate', 4, 120),
(5, 'Bachelor of Fine Arts', 'BFA', 'undergraduate', 4, 120),

-- Science Programs
(6, 'Bachelor of Science in Biology', 'BSB', 'undergraduate', 4, 120),
(6, 'Bachelor of Science in Chemistry', 'BSC', 'undergraduate', 4, 120)
ON CONFLICT DO NOTHING;

-- Continue with rest of data...
