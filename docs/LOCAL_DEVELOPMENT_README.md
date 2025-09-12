# Teaching Center - Local Development Scripts

This directory contains scripts to manage the local development environment for the Teaching Center application.

## Scripts Overview

### `start-local.sh`
Starts the complete local development environment:
- ✅ Checks if Docker is running
- ✅ Starts PostgreSQL database container
- ✅ Sets up database schema with Prisma
- ✅ Seeds database with sample data
- ✅ Starts Next.js development server on port 3001
- ✅ Provides access to database admin on port 8080

**Usage:**
```bash
./start-local.sh
```

**What it starts:**
- PostgreSQL database (localhost:5433)
- Adminer database admin (localhost:8080)
- Next.js development server (localhost:3001)

### `stop-local.sh`
Stops all services started by `start-local.sh`:
- ✅ Stops Next.js development server
- ✅ Stops PostCSS processes
- ✅ Stops Docker containers
- ✅ Cleans up temporary files
- ✅ Checks for remaining processes

**Usage:**
```bash
./stop-local.sh
```

**Options:**
- `--force` or `-f`: Force stop all processes (nuclear option)
- `--help` or `-h`: Show help message

## Demo Accounts

After running `start-local.sh`, you can log in with these demo accounts:

- **Admin**: admin@teachingcenter.com / demo123
- **Teacher**: teacher@teachingcenter.com / demo123
- **Parent**: parent@teachingcenter.com / demo123
- **Student**: student@teachingcenter.com / demo123

## Quick Commands

```bash
# Start everything
./start-local.sh

# Stop everything gracefully
./stop-local.sh

# Force stop everything (if needed)
./stop-local.sh --force

# Check what's running
ps aux | grep -E "(next|docker|postgres)"

# Check ports in use
lsof -i :3001
lsof -i :8080
```

## Troubleshooting

### If services don't stop properly:
```bash
# Manual cleanup
pkill -f "next dev"
docker compose -f docker-compose.db-only.yml down
rm -rf .next .turbo
```

### If ports are still in use:
```bash
# Kill processes on specific ports
kill $(lsof -ti:3001)
kill $(lsof -ti:8080)
```

### If Docker containers won't stop:
```bash
# Force stop all containers
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
```

## File Structure

```
teachingcenter/
├── start-local.sh      # Start development environment
├── stop-local.sh       # Stop development environment
├── docker-compose.db-only.yml  # Database configuration
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── seed.ts         # Database seeding script
└── src/                # Application source code
```

## Notes

- The scripts use Docker for the database, so Docker must be running
- The Next.js app runs on port 3001 by default
- Database admin interface is available at http://localhost:8080
- All services are configured for local development only
