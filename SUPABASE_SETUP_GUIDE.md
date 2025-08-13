# Supabase Database Setup Guide

## Step 1: Create Supabase Account & Project

### 1.1 Sign Up for Supabase
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify your email if required

### 1.2 Create New Project
1. Click "New Project" in your dashboard
2. Fill in project details:
   - **Project Name**: `teaching-center` (or your preferred name)
   - **Database Password**: Use a strong password (you can use the one in your template: `b$5-Y@-j9Z$7tcK`)
   - **Region**: Choose closest to your users (e.g., `West Europe` for Portugal)
   - **Pricing Plan**: Start with "Free" plan
3. Click "Create new project"
4. Wait 2-3 minutes for database provisioning

## Step 2: Get Database Connection Details

### 2.1 Find Your Database URL
1. In your Supabase project dashboard:
2. Go to **Settings** → **Database**
3. Scroll down to "Connection string"
4. Copy the **"URI"** connection string
5. It will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxxx.supabase.co:5432/postgres`

### 2.2 Get Additional Supabase Keys (Optional)
1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL**: `https://xxxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbG...` (for frontend if needed)

## Step 3: Deploy Database Schema

### 3.1 Update Local Environment
1. Create a `.env.production` file in your project root
2. Add your real Supabase database URL:
```bash
DATABASE_URL="postgresql://postgres:b$5-Y@-j9Z$7tcK@db.xxxxxxxxxxxxxx.supabase.co:5432/postgres"
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="https://your-app.vercel.app"
```

### 3.2 Deploy Schema to Supabase
Run these commands in your project directory:

```bash
# Set the environment to use production database
export DATABASE_URL="your-supabase-database-url"

# Push your Prisma schema to Supabase
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed the database with sample data
npx prisma db seed
```

### 3.3 Verify Schema Deployment
1. Go back to Supabase Dashboard
2. Click **Table Editor** in the sidebar
3. You should see all your tables:
   - `users`
   - `students`
   - `parents`
   - `staff`
   - `payments`
   - `tests`
   - `test_results`
   - `activities`
   - `messages`
   - `school_years`
   - `student_parents`
   - `teaching_plans`

## Step 4: Configure Vercel Environment

### 4.1 Add Environment Variables to Vercel
1. Go to [vercel.com](https://vercel.com) and open your project
2. Go to **Settings** → **Environment Variables**
3. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres` | Production |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` | Production |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production |

### 4.2 Generate NextAuth Secret
Run this command locally to generate a secure secret:
```bash
openssl rand -base64 32
```
Copy the output and use it as your `NEXTAUTH_SECRET`.

## Step 5: Deploy and Test

### 5.1 Deploy to Vercel
1. Push your latest changes to GitHub:
```bash
git add .
git commit -m "Add production environment configuration"
git push
```

2. Vercel will automatically redeploy with new environment variables

### 5.2 Test Your Application
1. Visit your Vercel URL
2. Try logging in with demo accounts:
   - **Admin**: `admin@teachingcenter.com` / `demo123`
   - **Teacher**: `teacher@teachingcenter.com` / `demo123`
   - **Parent**: `parent@teachingcenter.com` / `demo123`
   - **Student**: `student@teachingcenter.com` / `demo123`

## Step 6: Monitor and Manage

### 6.1 Database Management
- **Supabase Dashboard**: Use Table Editor for direct database access
- **Prisma Studio**: Run `npx prisma studio` locally for GUI database management
- **SQL Editor**: Available in Supabase for custom queries

### 6.2 Backup Strategy
- **Automatic Backups**: Supabase provides 7-day backup retention on free plan
- **Manual Backup**: Use `pg_dump` if needed for additional backups

### 6.3 Monitor Usage
- **Supabase Dashboard**: Monitor database size, requests, and usage
- **Free Plan Limits**:
  - 500MB database storage
  - 2GB bandwidth/month
  - Up to 50,000 monthly active users

## Common Issues & Solutions

### Issue 1: Connection Refused
**Problem**: Cannot connect to database
**Solution**: 
- Check DATABASE_URL format
- Ensure Supabase project is running
- Verify password is correct

### Issue 2: Schema Push Fails
**Problem**: `prisma db push` fails
**Solution**:
- Check internet connection
- Verify DATABASE_URL is correct
- Ensure Supabase project is provisioned

### Issue 3: Seeding Fails
**Problem**: Sample data not created
**Solution**:
- Run `npx prisma db seed` manually
- Check for any schema conflicts
- Verify all tables exist

### Issue 4: Authentication Not Working
**Problem**: Login fails in production
**Solution**:
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your domain exactly
- Ensure database contains seeded users

## Database Schema Overview

Your Teaching Center database includes:

### Core Tables:
- **Users**: Authentication and user management
- **Students**: Student profiles and academic info
- **Parents**: Parent profiles and contact info
- **Staff**: Teacher and admin profiles

### Academic Tables:
- **School Years**: Academic year management
- **Tests**: Test scheduling and management
- **Test Results**: Student test scores and grades
- **Activities**: School activities and events
- **Teaching Plans**: Personalized learning plans

### Financial Tables:
- **Payments**: Student payment tracking
- **Payment history and status**

### Communication Tables:
- **Messages**: Internal messaging system

## Next Steps After Setup

1. **Test All Features**: Verify each dashboard works correctly
2. **Import Real Data**: Replace seed data with actual school data
3. **Configure Backups**: Set up additional backup procedures if needed
4. **Monitor Performance**: Watch database performance and optimize queries
5. **Scale When Needed**: Upgrade to Supabase Pro when you exceed free limits

---

**🎉 Your Teaching Center Management System is now running on a production-ready PostgreSQL database with Supabase!**
