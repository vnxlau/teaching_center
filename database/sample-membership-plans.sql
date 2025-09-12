-- Insert sample membership plans
INSERT INTO membership_plans (id, name, description, days_per_week, monthly_price, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), '1 Day Plan', 'Attend one day per week - perfect for casual learning', 1, 50.00, true, NOW(), NOW()),
(gen_random_uuid(), '3 Days Plan', 'Attend three days per week - balanced learning approach', 3, 120.00, true, NOW(), NOW()),
(gen_random_uuid(), '5 Days Plan', 'Attend five days per week - intensive learning', 5, 180.00, true, NOW(), NOW()),
(gen_random_uuid(), 'Full Week Plan', 'Attend all days - unlimited access to all sessions', 7, 250.00, true, NOW(), NOW());
