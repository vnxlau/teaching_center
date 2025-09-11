-- CreateEnum
CREATE TYPE "public"."DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY');

-- AlterTable
ALTER TABLE "public"."attendances" ADD COLUMN     "checkInTime" TIMESTAMP(3),
ADD COLUMN     "checkOutTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."students" ADD COLUMN     "discountRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "membershipPlanId" TEXT,
ADD COLUMN     "monthlyDueAmount" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "public"."student_schedules" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dayOfWeek" "public"."DayOfWeek" NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."membership_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "daysPerWeek" INTEGER NOT NULL,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "dataType" TEXT NOT NULL DEFAULT 'string',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_schedules_studentId_dayOfWeek_key" ON "public"."student_schedules"("studentId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "membership_plans_name_key" ON "public"."membership_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "public"."system_settings"("key");

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_membershipPlanId_fkey" FOREIGN KEY ("membershipPlanId") REFERENCES "public"."membership_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_schedules" ADD CONSTRAINT "student_schedules_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
