-- Performance Optimization Indexes for Teaching Center
-- Add these indexes to improve query performance

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments("studentId");
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments("dueDate");
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_school_year ON payments("schoolYearId");
CREATE INDEX IF NOT EXISTS idx_payments_monthly_lookup ON payments("dueDate", status, "paymentType");

-- Students table indexes  
CREATE INDEX IF NOT EXISTS idx_students_active ON students("isActive");
CREATE INDEX IF NOT EXISTS idx_students_school_year ON students("schoolYearId");
CREATE INDEX IF NOT EXISTS idx_students_membership_plan ON students("membershipPlanId");
CREATE INDEX IF NOT EXISTS idx_students_user_lookup ON students("userId");

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Tests table indexes
CREATE INDEX IF NOT EXISTS idx_tests_student_id ON tests("studentId");
CREATE INDEX IF NOT EXISTS idx_tests_scheduled_date ON tests("scheduledDate");

-- Attendance table indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendances("studentId", date);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payments_monthly_stats ON payments("dueDate", status, "studentId") 
  WHERE "paymentType" = 'MONTHLY_FEE';

CREATE INDEX IF NOT EXISTS idx_active_students_with_plans ON students("isActive", "membershipPlanId", "schoolYearId")
  WHERE "isActive" = true AND "membershipPlanId" IS NOT NULL;
