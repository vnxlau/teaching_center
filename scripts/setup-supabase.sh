#!/bin/bash

# Supabase Database Setup Script for Teaching Center
# This script helps you deploy your database schema to Supabase

echo "🚀 Teaching Center - Supabase Database Setup"
echo "============================================="

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    echo "📝 Please create .env.production with your Supabase DATABASE_URL"
    echo "   Example: DATABASE_URL=\"postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres\""
    exit 1
fi

# Source the production environment
set -a
source .env.production
set +a

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env.production"
    echo "📝 Please add your Supabase database URL to .env.production"
    exit 1
fi

echo "📊 Database URL found: ${DATABASE_URL:0:30}..."

# Generate NextAuth secret if not exists
if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "🔐 Generating NextAuth secret..."
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"" >> .env.production
    echo "✅ NextAuth secret generated and added to .env.production"
fi

echo ""
echo "📋 Step 1: Installing dependencies..."
npm install

echo ""
echo "📋 Step 2: Generating Prisma client..."
npx prisma generate

echo ""
echo "📋 Step 3: Pushing database schema to Supabase..."
DATABASE_URL="$DATABASE_URL" npx prisma db push

if [ $? -eq 0 ]; then
    echo "✅ Database schema deployed successfully!"
else
    echo "❌ Failed to deploy database schema"
    echo "🔍 Please check your DATABASE_URL and Supabase project status"
    exit 1
fi

echo ""
echo "📋 Step 4: Seeding database with sample data..."
DATABASE_URL="$DATABASE_URL" npx prisma db seed

if [ $? -eq 0 ]; then
    echo "✅ Database seeded successfully!"
else
    echo "⚠️  Seeding failed - you may need to run it manually"
    echo "   Command: npx prisma db seed"
fi

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Go to Vercel and add these environment variables:"
echo "   - DATABASE_URL: $DATABASE_URL"
echo "   - NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
echo "   - NEXTAUTH_URL: https://your-app.vercel.app"
echo ""
echo "2. Deploy your app to Vercel"
echo ""
echo "3. Test with demo accounts:"
echo "   - Admin: admin@teachingcenter.com / demo123"
echo "   - Teacher: teacher@teachingcenter.com / demo123"
echo "   - Parent: parent@teachingcenter.com / demo123"
echo "   - Student: student@teachingcenter.com / demo123"
echo ""
echo "📖 For detailed instructions, see docs/SUPABASE_SETUP_GUIDE.md"
