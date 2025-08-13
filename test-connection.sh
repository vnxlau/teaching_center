#!/bin/bash

# Test different Supabase connection formats
echo "🔍 Testing Supabase Connection Formats"
echo "======================================"

# Original direct connection
echo "Testing direct connection..."
DATABASE_URL="postgresql://postgres:B0KPU5qmVAlMNtOD@db.ughljdbcetcizogtxwks.supabase.co:5432/postgres" \
npx prisma validate

# Connection pooler format 1
echo "Testing pooler format 1..."
DATABASE_URL="postgresql://postgres:B0KPU5qmVAlMNtOD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres" \
npx prisma validate

# Connection pooler format 2
echo "Testing pooler format 2..."
DATABASE_URL="postgresql://postgres.ughljdbcetcizogtxwks:B0KPU5qmVAlMNtOD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres" \
npx prisma validate

echo ""
echo "If all fail, please:"
echo "1. Check your Supabase project is running (not paused)"
echo "2. Verify the connection string in Supabase dashboard"
echo "3. Try from a different network (some ISPs block PostgreSQL ports)"
