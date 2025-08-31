/*
  Warnings:

  - You are about to drop the column `subjects` on the `teaching_plans` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `tests` table. All the data in the column will be lost.
  - Added the required column `subjectId` to the `tests` table without a default value. This is not possible if the table is not empty.

*/

-- CreateTable
CREATE TABLE "public"."subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."teaching_plan_subjects" (
    "id" TEXT NOT NULL,
    "teachingPlanId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "teaching_plan_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "public"."subjects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "public"."subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "teaching_plan_subjects_teachingPlanId_subjectId_key" ON "public"."teaching_plan_subjects"("teachingPlanId", "subjectId");

-- Insert default subjects
INSERT INTO "public"."subjects" ("id", "name", "description", "code", "isActive", "createdAt", "updatedAt") VALUES
('subj_math_001', 'Mathematics', 'Mathematics and arithmetic', 'MATH', true, NOW(), NOW()),
('subj_eng_001', 'English', 'English language and literature', 'ENG', true, NOW(), NOW()),
('subj_sci_001', 'Science', 'General science subjects', 'SCI', true, NOW(), NOW()),
('subj_hist_001', 'History', 'History and social studies', 'HIST', true, NOW(), NOW()),
('subj_geo_001', 'Geography', 'Geography and world studies', 'GEO', true, NOW(), NOW()),
('subj_phy_001', 'Physics', 'Physics and physical sciences', 'PHY', true, NOW(), NOW()),
('subj_chem_001', 'Chemistry', 'Chemistry and chemical sciences', 'CHEM', true, NOW(), NOW()),
('subj_bio_001', 'Biology', 'Biology and life sciences', 'BIO', true, NOW(), NOW()),
('subj_art_001', 'Art', 'Art and creative subjects', 'ART', true, NOW(), NOW()),
('subj_pe_001', 'Physical Education', 'Physical education and sports', 'PE', true, NOW(), NOW());

-- Add subjectId column to tests with a default value first
ALTER TABLE "public"."tests" ADD COLUMN "subjectId" TEXT;

-- Update existing tests to use the default Mathematics subject (or create subjects based on existing data)
UPDATE "public"."tests" SET "subjectId" = CASE 
    WHEN LOWER("subject") LIKE '%math%' THEN 'subj_math_001'
    WHEN LOWER("subject") LIKE '%english%' OR LOWER("subject") LIKE '%eng%' THEN 'subj_eng_001'
    WHEN LOWER("subject") LIKE '%science%' OR LOWER("subject") LIKE '%sci%' THEN 'subj_sci_001'
    WHEN LOWER("subject") LIKE '%history%' OR LOWER("subject") LIKE '%hist%' THEN 'subj_hist_001'
    WHEN LOWER("subject") LIKE '%geography%' OR LOWER("subject") LIKE '%geo%' THEN 'subj_geo_001'
    WHEN LOWER("subject") LIKE '%physics%' OR LOWER("subject") LIKE '%phy%' THEN 'subj_phy_001'
    WHEN LOWER("subject") LIKE '%chemistry%' OR LOWER("subject") LIKE '%chem%' THEN 'subj_chem_001'
    WHEN LOWER("subject") LIKE '%biology%' OR LOWER("subject") LIKE '%bio%' THEN 'subj_bio_001'
    WHEN LOWER("subject") LIKE '%art%' THEN 'subj_art_001'
    WHEN LOWER("subject") LIKE '%physical%' OR LOWER("subject") LIKE '%pe%' OR LOWER("subject") LIKE '%sport%' THEN 'subj_pe_001'
    ELSE 'subj_math_001' -- Default to Mathematics if no match
END;

-- Make subjectId NOT NULL
ALTER TABLE "public"."tests" ALTER COLUMN "subjectId" SET NOT NULL;

-- Migrate teaching plan subjects data
INSERT INTO "public"."teaching_plan_subjects" ("id", "teachingPlanId", "subjectId")
SELECT 
    'tps_' || "id" || '_' || (ROW_NUMBER() OVER (PARTITION BY "id" ORDER BY subject_name)) as "id",
    "id" as "teachingPlanId",
    CASE 
        WHEN LOWER(subject_name) LIKE '%math%' THEN 'subj_math_001'
        WHEN LOWER(subject_name) LIKE '%english%' OR LOWER(subject_name) LIKE '%eng%' THEN 'subj_eng_001'
        WHEN LOWER(subject_name) LIKE '%science%' OR LOWER(subject_name) LIKE '%sci%' THEN 'subj_sci_001'
        WHEN LOWER(subject_name) LIKE '%history%' OR LOWER(subject_name) LIKE '%hist%' THEN 'subj_hist_001'
        WHEN LOWER(subject_name) LIKE '%geography%' OR LOWER(subject_name) LIKE '%geo%' THEN 'subj_geo_001'
        WHEN LOWER(subject_name) LIKE '%physics%' OR LOWER(subject_name) LIKE '%phy%' THEN 'subj_phy_001'
        WHEN LOWER(subject_name) LIKE '%chemistry%' OR LOWER(subject_name) LIKE '%chem%' THEN 'subj_chem_001'
        WHEN LOWER(subject_name) LIKE '%biology%' OR LOWER(subject_name) LIKE '%bio%' THEN 'subj_bio_001'
        WHEN LOWER(subject_name) LIKE '%art%' THEN 'subj_art_001'
        WHEN LOWER(subject_name) LIKE '%physical%' OR LOWER(subject_name) LIKE '%pe%' OR LOWER(subject_name) LIKE '%sport%' THEN 'subj_pe_001'
        ELSE 'subj_math_001' -- Default to Mathematics if no match
    END as "subjectId"
FROM (
    SELECT "id", unnest("subjects") as subject_name
    FROM "public"."teaching_plans"
    WHERE "subjects" IS NOT NULL AND array_length("subjects", 1) > 0
) AS subject_expanded;

-- Now drop the old columns
ALTER TABLE "public"."teaching_plans" DROP COLUMN "subjects";
ALTER TABLE "public"."tests" DROP COLUMN "subject";

-- AddForeignKey
ALTER TABLE "public"."teaching_plan_subjects" ADD CONSTRAINT "teaching_plan_subjects_teachingPlanId_fkey" FOREIGN KEY ("teachingPlanId") REFERENCES "public"."teaching_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teaching_plan_subjects" ADD CONSTRAINT "teaching_plan_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tests" ADD CONSTRAINT "tests_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
