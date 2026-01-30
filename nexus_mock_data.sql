-- Users INSERT - extract from user's SQL
INSERT INTO users (name, username, email, password, role, must_change_password, created_at) VALUES
('System Administrator', 'admin', 'admin@nexus.edu', '$2b$10$YourHashedPasswordHere', 'admin', false, NOW()),
('John Administrator', 'john.admin', 'john.admin@nexus.edu', '$2b$10$YourHashedPasswordHere', 'admin', false, NOW()),
('Sarah Finance', 'sarah.finance', 'sarah.finance@nexus.edu', '$2b$10$YourHashedPasswordHere', 'accountant', false, NOW()),
('Mike Accounts', 'mike.accounts', 'mike.accounts@nexus.edu', '$2b$10$YourHashedPasswordHere', 'accountant', false, NOW()),
('Lisa Billing', 'lisa.billing', 'lisa.billing@nexus.edu', '$2b$10$YourHashedPasswordHere', 'accountant', false, NOW()),
('Dr. Robert Smith', 'dr.smith', 'robert.smith@nexus.edu', '$2b$10$YourHashedPasswordHere', 'teacher', false, NOW()),
('Prof. Emily Johnson', 'prof.johnson', 'emily.johnson@nexus.edu', '$2b$10$YourHashedPasswordHere', 'teacher', false, NOW()),
('Dr. Michael Williams', 'dr.williams', 'michael.williams@nexus.edu', '$2b$10$YourHashedPasswordHere', 'teacher', false, NOW()),
('Prof. Jennifer Davis', 'prof.davis', 'jennifer.davis@nexus.edu', '$2b$10$YourHashedPasswordHere', 'teacher', false, NOW()),
('Dr. Carlos Garcia', 'dr.garcia', 'carlos.garcia@nexus.edu', '$ 2b$10$YourHashedPasswordHere', 'teacher', false, NOW()),
('Prof. Maria Martinez', 'prof.martinez', 'maria.martinez@nexus.edu', '$2b$10$YourHashedPasswordHere', 'teacher', false, NOW()),
('Dr. James Anderson', 'dr.anderson', 'james.anderson@nexus.edu', '$2b$10$YourHashedPasswordHere', 'teacher', false, NOW()),
('Prof. Patricia Taylor', 'prof.taylor', 'patricia.taylor@nexus.edu', '$2b$10$YourHashedPasswordHere', 'teacher', false, NOW()),
('Dr. David Lee', 'dr.lee', 'david.lee@nexus.edu', '$2b$10$YourHashedPasswordHere', 'teacher', false, NOW()),
('Prof. Linda Wang', 'prof.wang', 'linda.wang@nexus.edu', '$2b$10$YourHashedPasswordHere', 'teacher', false, NOW()),
('Dr. Robert Taylor', 'dr.taylor', 'robert.taylor@nexus.edu', '$2b$10$YourHashedPasswordHere', 'teacher', false, NOW()),
('Prof. Patricia Anderson', 'prof.anderson2', 'patricia.anderson@nexus.edu', '$2b$10$YourHashedPasswordHere', 'teacher', false, NOW())
ON CONFLICT (username) DO NOTHING;
