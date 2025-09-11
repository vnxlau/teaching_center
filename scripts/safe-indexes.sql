-- Performance indexes for Teaching Center database
-- Safe index creation with IF NOT EXISTS

-- Index for payments table queries
DO $$
BEGIN
    -- Index for student payments lookup
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_student_id') THEN
        CREATE INDEX idx_payments_student_id ON payments("studentId");
    END IF;
    
    -- Index for payment date queries
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_due_date') THEN
        CREATE INDEX idx_payments_due_date ON payments("dueDate");
    END IF;
    
    -- Index for payment status
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_status') THEN
        CREATE INDEX idx_payments_status ON payments(status);
    END IF;
    
    -- Composite index for monthly payment queries
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_monthly') THEN
        CREATE INDEX idx_payments_monthly ON payments("schoolYearId", "dueDate", status);
    END IF;
END
$$;

-- Index for students table queries
DO $$
BEGIN
    -- Index for active students
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_active') THEN
        CREATE INDEX idx_students_active ON students("isActive");
    END IF;
    
    -- Index for student user lookup
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_user_id') THEN
        CREATE INDEX idx_students_user_id ON students("userId");
    END IF;
    
    -- Index for school year students
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_school_year') THEN
        CREATE INDEX idx_students_school_year ON students("schoolYearId", "isActive");
    END IF;
END
$$;

-- Index for users table queries
DO $$
BEGIN
    -- Index for role-based queries
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_role') THEN
        CREATE INDEX idx_users_role ON users(role);
    END IF;
    
    -- Index for email lookup
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
        CREATE INDEX idx_users_email ON users(email);
    END IF;
END
$$;

-- Analyze tables for query planner optimization
ANALYZE payments, students, users;
