DO $$ 
DECLARE
    -- ID Variables (Changed to INT to match actual DB schema)
    v_period_id INT;
    v_user_id INT;
    v_parent_user_id INT;
    v_teacher_user_id INT;
    v_parent_id INT;
    v_student_id INT;
    v_teacher_id INT;
    v_class_id INT;
    
    -- Arrays for Randomization
    v_first_names TEXT[] := ARRAY['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Margaret', 'Anthony', 'Betty', 'Donald', 'Sandra', 'Mark', 'Ashley', 'Paul', 'Dorothy', 'Steven', 'Kimberly', 'Andrew', 'Emily', 'Kenneth', 'Donna', 'Joshua', 'Michelle', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Edward', 'Deborah'];
    v_last_names TEXT[] := ARRAY['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins'];
    
    -- Loop Control
    v_student_count INT := 250;
    v_class_count INT := 12; -- Grades 1-12
    v_student_idx INT;
    v_class_idx INT;
    v_day_idx INT;
    
    -- Data Helpers
    v_random_fname TEXT;
    v_random_lname TEXT;
    v_random_status TEXT;
    v_fee_amount INT;
    v_attendance_status TEXT;
    v_class_ids INT[];

BEGIN
    RAISE NOTICE '🚀 Starting Generation of 250 Students & Linked Data...';

    -- ========================================================
    -- 1. SETUP ACADEMIC PERIOD
    -- ========================================================
    INSERT INTO academic_periods (name, start_date, end_date, is_active)
    VALUES ('Academic Year 2025-2026', '2025-04-01', '2026-03-31', true)
    RETURNING id INTO v_period_id;

    -- ========================================================
    -- 2. CREATE CLASSES & TEACHERS (Grades 1 to 12)
    -- ========================================================
    RAISE NOTICE '   Creating 12 Classes and Teachers...';
    
    FOR v_class_idx IN 1..v_class_count LOOP
        -- Create Teacher User
        INSERT INTO users (name, username, email, password, role)
        VALUES (
            'Teacher ' || v_last_names[v_class_idx], 
            'teacher_grade_' || v_class_idx, 
            'teacher' || v_class_idx || '@school.edu', 
            '$2b$10$hashedpassplaceholder', 
            'teacher'
        ) RETURNING id INTO v_teacher_user_id;

        -- Create Teacher Profile
        INSERT INTO teachers (user_id, department, phone)
        VALUES (v_teacher_user_id, 'General Ed', '555-01' || LPAD(v_class_idx::text, 2, '0'))
        RETURNING id INTO v_teacher_id;

        -- Create Class
        INSERT INTO classes (name, grade, section, class_teacher_id, academic_period_id)
        VALUES (
            'Grade ' || v_class_idx || '-A', 
            v_class_idx::text, 
            'A', 
            v_teacher_id, 
            v_period_id
        ) RETURNING id INTO v_class_id;

        -- Store Class ID in array for student assignment
        v_class_ids := array_append(v_class_ids, v_class_id);
    END LOOP;

    -- ========================================================
    -- 3. GENERATE 250 STUDENTS LOOP
    -- ========================================================
    RAISE NOTICE '   Generating 250 Students with Parents, Fees & Attendance...';

    FOR v_student_idx IN 1..v_student_count LOOP
        
        -- Pick Random Names
        v_random_fname := v_first_names[1 + floor(random() * 50)::int];
        v_random_lname := v_last_names[1 + floor(random() * 50)::int];
        
        -- Assign to Class (Cyclic assignment)
        v_class_id := v_class_ids[1 + (v_student_idx % v_class_count)];

        -- A. Create Parent
        INSERT INTO users (name, username, email, password, role)
        VALUES (
            'Parent of ' || v_random_fname, 
            'parent_' || v_student_idx, 
            'parent' || v_student_idx || '@mail.com', 
            '$2b$10$hashedpassplaceholder', 
            'parent'
        ) RETURNING id INTO v_parent_user_id;

        INSERT INTO parents (user_id, phone, address)
        VALUES (
            v_parent_user_id, 
            '555-P' || LPAD(v_student_idx::text, 3, '0'), 
            'Address Block ' || v_student_idx || ', City'
        ) RETURNING id INTO v_parent_id;

        -- B. Create Student
        INSERT INTO users (name, username, email, password, role)
        VALUES (
            v_random_fname || ' ' || v_random_lname, 
            'student_' || v_student_idx, 
            'student' || v_student_idx || '@school.edu', 
            '$2b$10$hashedpassplaceholder', 
            'student'
        ) RETURNING id INTO v_user_id;

        INSERT INTO students (
            user_id, admission_no, class_id, parent_id, 
            dob, gender, phone, address, status
        )
        VALUES (
            v_user_id, 
            'ADM25-' || LPAD(v_student_idx::text, 4, '0'), 
            v_class_id, 
            v_parent_id, 
            '2015-01-01', -- Simplified DOB
            (CASE WHEN v_student_idx % 2 = 0 THEN 'male' ELSE 'female' END)::gender,
            '555-S' || LPAD(v_student_idx::text, 3, '0'), 
            'Student Address ' || v_student_idx, 
            'approved'::student_status
        ) RETURNING id INTO v_student_id;

        -- C. Create Fees (Random Status)
        v_fee_amount := 50000 + (floor(random() * 5) * 10000); -- 50k - 90k
        v_random_status := CASE WHEN random() > 0.3 THEN 'paid' ELSE 'pending' END;

        INSERT INTO fees (student_id, amount, due_date, status, description)
        VALUES (
            v_student_id, 
            v_fee_amount, 
            '2025-05-15', 
            v_random_status::fee_status, 
            'Term 1 Tuition Fee'
        );
        
        -- Add Library Fee for some
        IF random() > 0.5 THEN
            INSERT INTO fees (student_id, amount, due_date, status, description)
            VALUES (v_student_id, 2000, '2025-05-15', 'pending', 'Library Deposit');
        END IF;

        -- D. Generate 30 Days of Attendance
        FOR v_day_idx IN 0..29 LOOP
            -- Skip weekends (roughly)
            IF (v_day_idx % 7) < 5 THEN 
                -- Weighted Random Attendance: 90% Present, 5% Absent, 5% Late
                IF random() < 0.90 THEN v_attendance_status := 'present';
                ELSIF random() < 0.95 THEN v_attendance_status := 'late';
                ELSE v_attendance_status := 'absent';
                END IF;

                INSERT INTO attendance (student_id, date, status)
                VALUES (
                    v_student_id, 
                    CURRENT_DATE - (v_day_idx || ' days')::INTERVAL, 
                    v_attendance_status::attendance_status
                );
            END IF;
        END LOOP;

    END LOOP;

    RAISE NOTICE '✅ Successfully created 250 Students, 250 Parents, ~500 Fees, and ~5000 Attendance records!';
END $$;
