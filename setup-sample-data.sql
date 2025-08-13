-- Sample Data for Teaching Center Management System
-- Run this after running setup-database.sql

-- Insert School Year
INSERT INTO "public"."school_years" ("id", "name", "startDate", "endDate", "isActive", "createdAt", "updatedAt") VALUES
('schoolyear1', '2024-2025', '2024-09-01T00:00:00.000Z', '2025-06-30T00:00:00.000Z', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Users (with bcrypt hashed passwords for 'demo123')
INSERT INTO "public"."users" ("id", "email", "name", "password", "role", "createdAt", "updatedAt") VALUES
('admin1', 'admin@teachingcenter.com', 'Admin User', '$2a$10$K7L1OJ45/4Y2nIvL0DQbu.L21UQ2sKLyPQjhF8nTTNXfMEYGAd5qG', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('teacher1', 'teacher@teachingcenter.com', 'Maria Silva', '$2a$10$K7L1OJ45/4Y2nIvL0DQbu.L21UQ2sKLyPQjhF8nTTNXfMEYGAd5qG', 'STAFF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('parent1', 'parent@teachingcenter.com', 'João Santos', '$2a$10$K7L1OJ45/4Y2nIvL0DQbu.L21UQ2sKLyPQjhF8nTTNXfMEYGAd5qG', 'PARENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student1', 'student@teachingcenter.com', 'Ana Costa', '$2a$10$K7L1OJ45/4Y2nIvL0DQbu.L21UQ2sKLyPQjhF8nTTNXfMEYGAd5qG', 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student2', 'pedro@example.com', 'Pedro Oliveira', '$2a$10$K7L1OJ45/4Y2nIvL0DQbu.L21UQ2sKLyPQjhF8nTTNXfMEYGAd5qG', 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Staff
INSERT INTO "public"."staff" ("id", "userId", "firstName", "lastName", "position", "phone", "hireDate", "isActive", "createdAt", "updatedAt") VALUES
('staff1', 'admin1', 'Admin', 'User', 'Administrator', '+351912345678', CURRENT_TIMESTAMP, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('staff2', 'teacher1', 'Maria', 'Silva', 'Teacher', '+351923456789', CURRENT_TIMESTAMP, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Students
INSERT INTO "public"."students" ("id", "userId", "firstName", "lastName", "studentCode", "dateOfBirth", "grade", "schoolYearId", "enrollmentDate", "isActive", "createdAt", "updatedAt") VALUES
('student1', 'student1', 'Ana', 'Costa', 'STU001', '2010-05-15T00:00:00.000Z', '8º Ano', 'schoolyear1', CURRENT_TIMESTAMP, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student2', 'student2', 'Pedro', 'Oliveira', 'STU002', '2009-08-22T00:00:00.000Z', '9º Ano', 'schoolyear1', CURRENT_TIMESTAMP, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Parents
INSERT INTO "public"."parents" ("id", "userId", "firstName", "lastName", "phone", "email", "createdAt", "updatedAt") VALUES
('parent1', 'parent1', 'João', 'Santos', '+351934567890', 'parent@teachingcenter.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Student-Parent Relationships
INSERT INTO "public"."student_parents" ("id", "studentId", "parentId", "relationship") VALUES
('sp1', 'student1', 'parent1', 'Father');

-- Insert Sample Payments
INSERT INTO "public"."payments" ("id", "studentId", "schoolYearId", "amount", "dueDate", "paymentType", "status", "notes", "createdAt", "updatedAt") VALUES
('payment1', 'student1', 'schoolyear1', 50.00, '2024-09-30T00:00:00.000Z', 'MONTHLY_FEE', 'PAID', 'September fee', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payment2', 'student1', 'schoolyear1', 50.00, '2024-10-31T00:00:00.000Z', 'MONTHLY_FEE', 'PENDING', 'October fee', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payment3', 'student2', 'schoolyear1', 50.00, '2024-09-30T00:00:00.000Z', 'MONTHLY_FEE', 'PAID', 'September fee', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Sample Tests
INSERT INTO "public"."tests" ("id", "schoolYearId", "staffId", "title", "subject", "description", "scheduledDate", "maxScore", "isActive", "createdAt", "updatedAt") VALUES
('test1', 'schoolyear1', 'staff2', 'Mathematics Quiz', 'Mathematics', 'Basic algebra and geometry', '2024-10-15T10:00:00.000Z', 100.00, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('test2', 'schoolyear1', 'staff2', 'Portuguese Essay', 'Portuguese', 'Creative writing assignment', '2024-10-20T14:00:00.000Z', 100.00, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Test Results
INSERT INTO "public"."test_results" ("id", "testId", "studentId", "score", "notes", "createdAt", "updatedAt") VALUES
('result1', 'test1', 'student1', 85.00, 'Good understanding of concepts', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('result2', 'test1', 'student2', 92.00, 'Excellent work', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('result3', 'test2', 'student1', 78.00, 'Creative approach, needs grammar work', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Sample Activities
INSERT INTO "public"."activities" ("id", "schoolYearId", "staffId", "title", "description", "activityType", "scheduledDate", "isCompleted", "createdAt", "updatedAt") VALUES
('activity1', 'schoolyear1', 'staff2', 'Science Fair', 'Annual science project exhibition', 'EVENT', '2024-11-15T10:00:00.000Z', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('activity2', 'schoolyear1', 'staff2', 'Math Homework', 'Chapter 5 exercises', 'ASSIGNMENT', '2024-10-20T00:00:00.000Z', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Student Activities
INSERT INTO "public"."student_activities" ("id", "studentId", "activityId", "status", "grade", "notes", "createdAt", "updatedAt") VALUES
('sa1', 'student1', 'activity2', 'COMPLETED', 85.00, 'Good work on exercises', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sa2', 'student2', 'activity2', 'COMPLETED', 90.00, 'Excellent understanding', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Sample Messages
INSERT INTO "public"."messages" ("id", "senderId", "recipientId", "senderType", "recipientType", "subject", "content", "isRead", "createdAt", "updatedAt") VALUES
('msg1', 'staff2', 'parent1', 'STAFF', 'PARENT', 'Student Progress Update', 'Ana is doing well in mathematics. Keep up the good work!', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('msg2', 'staff1', NULL, 'STAFF', 'PARENT', 'School Announcement', 'Parent-teacher meetings scheduled for next week.', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Sample Teaching Plans
INSERT INTO "public"."teaching_plans" ("id", "studentId", "subjects", "goals", "methodology", "schedule", "notes", "createdAt", "updatedAt") VALUES
('plan1', 'student1', ARRAY['Mathematics'], 'Focus on algebra fundamentals', 'Visual learning with practical examples', 'Monday and Wednesday 3-4 PM', 'Student responds well to visual aids', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('plan2', 'student2', ARRAY['Portuguese'], 'Improve writing skills', 'Writing exercises and reading comprehension', 'Tuesday and Thursday 2-3 PM', 'Focus on creative writing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Sample Attendance
INSERT INTO "public"."attendances" ("id", "studentId", "schoolYearId", "date", "status", "notes", "createdAt", "updatedAt") VALUES
('att1', 'student1', 'schoolyear1', '2024-10-01', 'PRESENT', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('att2', 'student1', 'schoolyear1', '2024-10-02', 'PRESENT', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('att3', 'student2', 'schoolyear1', '2024-10-01', 'PRESENT', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('att4', 'student2', 'schoolyear1', '2024-10-02', 'LATE', 'Arrived 10 minutes late', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
