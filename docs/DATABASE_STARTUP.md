# Teaching Center - Database Startup Guide

## Quick Start

### Option 1: Start Database Only (Recommended)
```bash
# Start just the database
./start-local-db.sh

# In another terminal, start the app
npm run dev
```

### Option 2: Start Everything at Once
```bash
# Start database + setup + app (all in one)
npm run local:start
```

## Database Details

- **Host**: localhost
- **Port**: 5433 (external), 5432 (internal)
- **User**: postgres
- **Password**: password123
- **Database**: teachingcenter
- **Admin Interface**: http://localhost:8080

## Available Commands

```bash
# Start database only
./start-local-db.sh

# Stop database
npm run local:db:stop

# Reset database (stop + remove data + restart)
npm run local:db:reset

# Start everything (database + app)
npm run local:start

# View database in browser
npm run db:studio
```

## Workflow

1. **First time setup**: Run `./start-local-db.sh` and choose "y" to setup schema
2. **Daily development**: Run `./start-local-db.sh` (choose "n" for setup)
3. **Start coding**: Run `npm run dev` in another terminal
4. **Stop when done**: Run `npm run local:db:stop`

## Troubleshooting

- **Port 5433 in use**: Check if another PostgreSQL is running locally
- **Docker not running**: Start Docker with `sudo systemctl start docker`
- **Database connection issues**: Ensure database is healthy with `docker compose -f docker-compose.db-only.yml ps`
