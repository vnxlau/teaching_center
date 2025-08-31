-- CreateTable: SystemSettings
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "data_type" TEXT NOT NULL DEFAULT 'string',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- Insert default system settings
INSERT INTO "system_settings" ("id", "key", "value", "description", "category", "data_type", "is_public", "created_at", "updated_at") VALUES
(gen_random_uuid(), 'school_name', 'Teaching Center Excellence', 'Name of the educational institution', 'general', 'string', true, NOW(), NOW()),
(gen_random_uuid(), 'school_address', '123 Education Street, Learning City, LC 12345', 'Physical address of the school', 'general', 'string', true, NOW(), NOW()),
(gen_random_uuid(), 'school_phone', '+351 123 456 789', 'Main contact phone number', 'general', 'string', true, NOW(), NOW()),
(gen_random_uuid(), 'school_email', 'info@teachingcenter.com', 'Main contact email address', 'general', 'string', true, NOW(), NOW()),
(gen_random_uuid(), 'academic_year', '2024-2025', 'Current academic year period', 'academic', 'string', false, NOW(), NOW()),
(gen_random_uuid(), 'currency', 'EUR', 'Default currency for financial operations', 'financial', 'string', false, NOW(), NOW()),
(gen_random_uuid(), 'timezone', 'Europe/Lisbon', 'Default timezone for the institution', 'general', 'string', false, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;
