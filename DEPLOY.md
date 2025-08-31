# 🚀 Teaching Center - Production Deployment Guide

This guide will help you deploy the Teaching Center application to production.

## 📋 Prerequisites

- **Docker** and **Docker Compose** installed on the production server
- **Domain name** (optional, but recommended)
- **SSL certificate** (for HTTPS, recommended)

## 🔧 Production Setup

### 1. Environment Configuration

```bash
# Copy the example production environment file
cp .env.production.example .env.production

# Edit the production environment variables
nano .env.production
```

**Required variables to update:**
- `POSTGRES_PASSWORD`: Set a strong password for the database
- `NEXTAUTH_SECRET`: Generate a secure secret (use `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Set your production domain URL

### 2. Deploy with Docker

```bash
# Start production environment
./start-production.sh

# Or manually:
sudo docker compose up -d --build
```

This will start:
- **PostgreSQL Database** on port 5432 (internal)
- **Next.js Application** on port 3000
- **Database Admin (Adminer)** on port 8080

### 3. Database Setup

The production containers will automatically:
1. Create the PostgreSQL database
2. Apply database migrations
3. The application will be ready to use

**Initial Admin Account:**
- Email: `admin@teachingcenter.com`
- Password: `demo123`

⚠️ **Important**: Change the admin password immediately after first login!

## 🌐 Access Points

- **Main Application**: http://your-server:3000
- **Database Admin**: http://your-server:8080

## 🔧 Management Commands

```bash
# Start production environment
./start-production.sh start

# Stop production environment
./start-production.sh stop

# Restart production environment
./start-production.sh restart

# View status and logs
./start-production.sh status

# Follow logs
./start-production.sh logs
```

## 🔒 Security Considerations

### 1. Database Security
- Use strong passwords
- Consider restricting database admin access
- Regularly backup your data

### 2. Application Security
- Use HTTPS in production
- Set strong NEXTAUTH_SECRET
- Consider using environment-specific secrets management

### 3. Network Security
- Use a reverse proxy (nginx, caddy)
- Configure firewall rules
- Consider VPN access for admin interfaces

## 📊 Monitoring

### Check Application Status
```bash
# View running containers
sudo docker compose ps

# Check application logs
sudo docker compose logs app

# Check database logs
sudo docker compose logs postgres
```

### Health Checks
The PostgreSQL container includes health checks. The application depends on a healthy database.

## 🔄 Backups

### Database Backup
```bash
# Create backup
sudo docker compose exec postgres pg_dump -U postgres teachingcenter > backup.sql

# Restore backup
sudo docker compose exec -T postgres psql -U postgres teachingcenter < backup.sql
```

### Full System Backup
```bash
# Stop containers
sudo docker compose down

# Backup data volume
sudo docker run --rm -v teachingcenter_postgres_data:/volume -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz -C /volume .

# Start containers
sudo docker compose up -d
```

## 🔧 Troubleshooting

### Application Won't Start
```bash
# Check container status
sudo docker compose ps

# View application logs
sudo docker compose logs app

# Check database connectivity
sudo docker compose exec app npx prisma db push
```

### Database Issues
```bash
# Check database logs
sudo docker compose logs postgres

# Connect to database
sudo docker compose exec postgres psql -U postgres -d teachingcenter

# Reset database (⚠️ DATA LOSS)
sudo docker compose down -v
sudo docker compose up -d
```

### Performance Issues
```bash
# Monitor resource usage
sudo docker stats

# Check disk space
df -h

# View detailed logs
sudo docker compose logs -f --tail=100
```

## 🔄 Updates

### Application Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
./start-production.sh restart
```

### Database Migrations
```bash
# Apply new migrations
sudo docker compose exec app npx prisma migrate deploy

# Or rebuild if needed
sudo docker compose up --build -d
```

## 📞 Support

For production issues:
1. Check the logs first: `sudo docker compose logs`
2. Review this troubleshooting guide
3. Check the application status: `./start-production.sh status`
4. Consult the development team

---

**Production Checklist:**
- [ ] Updated `.env.production` with secure values
- [ ] Changed default admin password
- [ ] Configured HTTPS (recommended)
- [ ] Set up regular backups
- [ ] Configured monitoring
- [ ] Tested disaster recovery procedures
