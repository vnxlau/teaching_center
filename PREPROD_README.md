# Pre-Production Environment Setup

This guide explains how to run the Teaching Center application using the production Docker image locally while connecting to your Supabase database. This is perfect for testing production builds with real data before deployment.

## Overview

The pre-prod environment:
- ✅ Uses the production Docker image (`teachingcenter:latest`)
- ✅ Connects to your live Supabase database
- ✅ Runs on `http://localhost:3000`
- ✅ Includes all production optimizations
- ⚠️ **Uses real production data** - be careful!

## Prerequisites

- Docker and Docker Compose installed
- Access to Supabase database
- `.env.preprod` file configured

## Quick Start

### 1. Configure Environment

Copy and update the pre-prod environment file:

```bash
cp .env.production .env.preprod
# Edit .env.preprod with your Supabase credentials
```

### 2. Start Pre-Prod Environment

```bash
# Make scripts executable (first time only)
chmod +x scripts/start-preprod.sh
chmod +x scripts/stop-preprod.sh

# Start the environment
./scripts/start-preprod.sh
```

### 3. Access Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration Files

### `.env.preprod`
```env
# Database (Supabase)
DATABASE_URL="your-supabase-connection-string"
DIRECT_URL="your-supabase-connection-string"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Environment flags
NODE_ENV=production
PREPROD=true
APP_ENV=preprod

# Supabase (optional)
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### `docker-compose.preprod.yml`
- Uses `teachingcenter:latest` image
- Loads `.env.preprod` environment variables
- Maps port 3000 to localhost
- Includes health checks

## Available Scripts

### Start Pre-Prod
```bash
./scripts/start-preprod.sh
```
- Builds production Docker image
- Starts containers with Supabase connection
- Waits for application to be ready
- Shows access information

### Stop Pre-Prod
```bash
./scripts/stop-preprod.sh
```
- Stops all containers
- Cleans up Docker resources

### Manual Docker Commands
```bash
# Build image manually
docker build -f docker/Dockerfile -t teachingcenter:latest .

# Start services
docker-compose -f docker-compose.preprod.yml up -d

# View logs
docker-compose -f docker-compose.preprod.yml logs -f app

# Stop services
docker-compose -f docker-compose.preprod.yml down
```

## Environment Comparison

| Environment | Database | Image | Purpose |
|-------------|----------|-------|---------|
| **Development** | Local PostgreSQL | `npm run dev` | Active development |
| **Pre-Prod** | Supabase (Production) | Production Docker | Testing with real data |
| **Production** | Supabase | Vercel | Live application |

## Important Notes

### ⚠️ Data Safety
- **This environment connects to your PRODUCTION Supabase database**
- Any data changes will affect your live application
- Use read-only operations when possible
- Backup important data before testing

### 🔍 Debugging
- Check container logs: `docker-compose -f docker-compose.preprod.yml logs -f app`
- Access container shell: `docker exec -it teachingcenter-app-preprod sh`
- View environment variables: `docker exec teachingcenter-app-preprod env`

### 🔄 Updates
- Rebuild image after code changes: `./scripts/start-preprod.sh`
- Environment variables require container restart
- Database schema changes need migration in Supabase

## Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9
# Or use different port in docker-compose.preprod.yml
```

**Database connection fails:**
- Verify Supabase credentials in `.env.preprod`
- Check Supabase project status
- Ensure IP allowlist includes your local IP

**Container fails to start:**
```bash
# Check logs
docker-compose -f docker-compose.preprod.yml logs app

# Rebuild image
docker-compose -f docker-compose.preprod.yml build --no-cache
```

**Application not responding:**
- Wait for health check to pass (up to 2 minutes)
- Check if all environment variables are set
- Verify database connectivity

## Integration with Development Workflow

### Recommended Workflow
1. **Develop locally** with `npm run dev` (local database)
2. **Test with real data** using pre-prod environment
3. **Deploy to production** via Vercel

### Switching Between Environments
```bash
# Development
./scripts/start-local.sh

# Pre-Production (with real data)
./scripts/start-preprod.sh

# Production deployment
npm run build && vercel --prod
```

## Performance Considerations

- Production image includes optimizations
- Bundle size is minimized
- Static assets are optimized
- API routes are production-ready

## Security Notes

- Never commit `.env.preprod` to version control
- Use strong `NEXTAUTH_SECRET`
- Regularly rotate Supabase credentials
- Monitor Supabase usage and costs

---

**🎯 Perfect for final testing before production deployment!**