#!/bin/bash

# Teaching Center Local Development Setup and Verification Script

echo "🚀 Teaching Center Local Development Setup"
echo "=========================================="

# Check if Docker is running
if ! sudo docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start database if not running
echo "📦 Checking database status..."
if ! sudo docker ps | grep -q teachingcenter-postgres; then
    echo "🔧 Starting PostgreSQL database..."
    sudo docker compose -f docker-compose.db-only.yml up -d
    echo "⏳ Waiting for database to be ready..."
    sleep 8
else
    echo "✅ Database is already running"
fi

# Verify database connection and setup
echo "🔍 Verifying database setup..."
npx prisma generate > /dev/null 2>&1

# Run seed if needed
USER_COUNT=$(npx prisma db seed 2>/dev/null | grep -o "Total users in database: [0-9]*" | grep -o "[0-9]*" || echo "0")
if [ "$USER_COUNT" -lt 6 ]; then
    echo "🌱 Seeding database with demo data..."
    npx tsx prisma/seed.ts
else
    echo "✅ Database already contains demo data"
fi

# Show available demo accounts
echo ""
echo "📋 Demo Accounts Available:"
echo "==========================="
echo "Admin:    admin@teachingcenter.com / demo123"
echo "Teacher:  teacher@teachingcenter.com / demo123"  
echo "Parent:   parent1@example.com / demo123"
echo "Student:  student1@example.com / demo123"
echo ""
echo "🌐 Application will be available at: http://localhost:3001"
echo "🗄️  Database admin available at: http://localhost:5555 (Prisma Studio)"
echo ""
echo "✅ Setup complete! You can now run 'npm run dev' to start the application."
