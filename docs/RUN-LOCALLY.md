# 🚀 Teaching Center - Local Development Guide

This guide will help you run the Teaching Center application locally for development.

## 📋 Prerequisites

Before you start, make sure you have:

- **Node.js 18+** installed
- **Docker** installed and running
- **Git** (to clone the repository)
- **npm** or **yarn** package manager

## 🔧 Quick Start

### Option 1: Using the Startup Script (Recommended)

```bash
# Clone the repository (if you haven't already)
git clone <repository-url>
cd teaching-center

# Install dependencies
npm install

# Start everything with one command
./start-local.sh
```

The script will:
1. ✅ Check if Docker is running
2. 🐘 Start PostgreSQL database container
3. ⏳ Wait for database to be ready
4. 🗄️ Setup database schema and seed data
5. 🌐 Start Next.js development server

### Option 2: Manual Step-by-Step

```bash
# 1. Install dependencies
npm install

# 2. Start database only
npm run local:db:start

# 3. Setup database schema and seed data
npm run local:db:setup

# 4. Start development server
npm run dev
```

## 🌐 Access Points

Once everything is running, you can access:

- **Main Application**: http://localhost:3001
- **Database Admin (Adminer)**: http://localhost:8080
- **Prisma Studio**: `npm run db:studio` (opens in browser)

## 🔑 Demo Accounts

Use these accounts to test the application:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@teachingcenter.com | demo123 |
| Teacher | teacher@teachingcenter.com | demo123 |
| Parent | parent@teachingcenter.com | demo123 |
| Student | student@teachingcenter.com | demo123 |

## 🗃️ Database Configuration

### Local Development Setup
- **Database**: PostgreSQL 15 in Docker container
- **Port**: 5433 (external) → 5432 (internal)
- **Database Name**: teachingcenter
- **Username**: postgres
- **Password**: password123
- **Connection URL**: `postgresql://postgres:password123@localhost:5433/teachingcenter`

### Database Admin Access
- **URL**: http://localhost:8080
- **Server**: postgres (or localhost:5433)
- **Database**: teachingcenter
- **Username**: postgres
- **Password**: password123

## 📝 Available Scripts

### Local Development
```bash
# Start everything (database + app)
npm run local:start

# Database management
npm run local:db:start     # Start database container
npm run local:db:stop      # Stop database container
npm run local:db:setup     # Setup schema and seed data
npm run local:db:reset     # Reset database (removes all data)

# Development server only
npm run dev               # Start Next.js on port 3001
```

### Database Tools
```bash
npm run db:studio         # Open Prisma Studio
npm run db:seed           # Seed database with sample data
npm run db:generate       # Generate Prisma client
npm run db:migrate        # Run database migrations
```

## 🐳 Docker Configuration

### Local Development (docker-compose.db-only.yml)
This configuration runs **only the PostgreSQL database** in Docker:

```yaml
services:
  postgres:          # Database on port 5433
  adminer:           # Database admin on port 8080
```

Your Next.js app runs locally with `npm run dev`.

### Production (docker-compose.yml)
This configuration runs **everything** in Docker containers:

```yaml
services:
  postgres:          # Database on port 5432
  app:              # Next.js app on port 3000
  adminer:          # Database admin on port 8080
```

## 🔧 Troubleshooting

### Database Connection Issues

**Problem**: App can't connect to database
```bash
# Check if database container is running
sudo docker ps

# Check database logs
sudo docker compose -f docker-compose.db-only.yml logs postgres

# Restart database
npm run local:db:stop
npm run local:db:start
```

**Problem**: Port 5433 already in use
```bash
# Find what's using the port
sudo lsof -i:5433

# Or use a different port by editing docker-compose.db-only.yml
```

### App Startup Issues

**Problem**: Port 3001 already in use
```bash
# Find what's using the port
sudo lsof -i:3001

# Kill the process or change port in package.json
```

**Problem**: Prisma client errors
```bash
# Regenerate Prisma client
npm run db:generate

# Push schema to database
npx prisma db push
```

### Docker Issues

**Problem**: Docker not running
```bash
# Start Docker service (Ubuntu/Debian)
sudo systemctl start docker

# Or start Docker Desktop (Mac/Windows)
```

**Problem**: Permission denied
```bash
# Add your user to docker group (Linux)
sudo usermod -aG docker $USER
# Log out and back in

# Or use sudo with docker commands
```

## 🗂️ Environment Variables

### .env.local (for local development)
```bash
# Local PostgreSQL Database
DATABASE_URL="postgresql://postgres:password123@localhost:5433/teachingcenter"

# NextAuth Configuration  
NEXTAUTH_SECRET="your-secret-key-for-local-dev"
NEXTAUTH_URL="http://localhost:3001"

# Optional: Disable external services for local dev
SKIP_ENV_VALIDATION=true
```

### .env (fallback)
```bash
# Same as .env.local but as fallback
DATABASE_URL="postgresql://postgres:password123@localhost:5433/teachingcenter"
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=AzD9A/D+5n/YdOQWDvDplvUdG1MQPiZIzRb3qcXxMmo=
NODE_ENV=development
```

## 🚀 Ready to Develop!

Once everything is running:

1. ✅ Visit http://localhost:3001
2. ✅ Login with demo accounts
3. ✅ Start coding!
4. ✅ Changes auto-reload with hot reloading

## 🛑 Stopping the Application

### Stop Everything
```bash
# If using start-local.sh script, press Ctrl+C
# This will stop both app and database

# Or manually:
npm run local:db:stop  # Stop database
# Ctrl+C in terminal running npm run dev
```

### Keep Database Running
```bash
# Stop only the app (Ctrl+C in dev server terminal)
# Database keeps running for faster restarts
```

## 📚 Next Steps

- Check out the [Production Deployment Guide](./DEPLOY.md)
- Review the [Database Schema](./prisma/schema.prisma)
- Explore the [API Documentation](./docs/api.md)
- Read the [Contributing Guidelines](./CONTRIBUTING.md)

---

**Need Help?** 
- Check the logs: `sudo docker compose -f docker-compose.db-only.yml logs`
- Open an issue in the repository
- Review the troubleshooting section above
