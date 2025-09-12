#!/bin/bash

# Teaching Center - Local Database Startup Script
# This script starts only the PostgreSQL database for local development
# Run this once, then use 'npm run dev' to start the Next.js app

set -e

echo "🗄️  Starting Teaching Center Local Database..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    print_status "Checking Docker..."
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        print_status "You can start Docker with: sudo systemctl start docker"
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if database is already running
check_database_running() {
    if docker compose -f docker/docker-compose.db-only.yml ps --format "table {{.Service}}\t{{.Status}}" | grep -q "Up"; then
        print_warning "Database is already running!"
        print_status "To stop it: npm run local:db:stop"
        print_status "To reset it: npm run local:db:reset"
        exit 0
    fi
}

# Function to start database
start_database() {
    print_status "Starting PostgreSQL database container..."

    # Start the database container
    if ! docker compose -f docker/docker-compose.db-only.yml up -d; then
        print_error "Failed to start database container"
        exit 1
    fi

    print_status "Waiting for database to be ready..."

    # Wait for the database to be healthy
    local retries=30
    while [ $retries -gt 0 ]; do
        if docker compose -f docker/docker-compose.db-only.yml ps --format "table {{.Service}}\t{{.Status}}" | grep -q "healthy"; then
            print_success "Database is ready!"
            break
        fi

        echo -n "."
        sleep 2
        ((retries--))
    done

    if [ $retries -eq 0 ]; then
        print_error "Database failed to start properly"
        print_status "Checking logs..."
        docker compose -f docker/docker-compose.db-only.yml logs postgres
        exit 1
    fi
}

# Function to setup database schema (optional)
setup_database() {
    print_status "Setting up database schema..."

    # Generate Prisma client
    if ! npx prisma generate; then
        print_warning "Prisma client generation failed, continuing anyway..."
    fi

    # Push schema to database
    if npx prisma db push --skip-generate; then
        print_success "Database schema updated"
    else
        print_warning "Database schema push failed, continuing anyway..."
    fi

    # Seed the database
    print_status "Seeding database with sample data..."
    if npm run db:seed; then
        print_success "Database seeded successfully"
    else
        print_warning "Database seeding failed, continuing anyway..."
    fi
}

# Function to show status
show_status() {
    echo ""
    print_success "Database is running!"
    echo ""
    print_status "Database Details:"
    echo "  📍 Host: localhost"
    echo "  🔌 Port: 5433 (external), 5432 (internal)"
    echo "  👤 User: postgres"
    echo "  🔑 Password: password123"
    echo "  📊 Database: teachingcenter"
    echo ""
    print_status "Admin Interface:"
    echo "  🌐 URL: http://localhost:8080"
    echo "  👤 System: PostgreSQL"
    echo "  📍 Server: postgres"
    echo ""
    print_status "Next Steps:"
    echo "  ▶️  Run: npm run dev"
    echo "  🌐 App will be at: http://localhost:3001"
    echo ""
    print_status "Stop Commands:"
    echo "  🛑 Database only: npm run local:db:stop"
    echo "  🛑 Everything: npm run local:db:reset"
}

# Function to cleanup on exit
cleanup() {
    print_status "Stopping database..."
    docker compose -f docker/docker-compose.db-only.yml down
    print_success "Database stopped"
}

# Set trap to cleanup on script exit (only if interrupted)
trap cleanup INT

# Main execution
main() {
    echo "╔══════════════════════════════════════════════╗"
    echo "║        Teaching Center - Database Only       ║"
    echo "╚══════════════════════════════════════════════╝"
    echo ""

    check_docker
    check_database_running
    start_database

    # Ask if user wants to setup database
    echo ""
    read -p "Do you want to setup/reset the database schema and seed data? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_database
    else
        print_status "Skipping database setup. Use existing schema."
    fi

    show_status

    echo ""
    print_status "Database is running in background..."
    print_status "Press Ctrl+C to stop the database"
    echo ""

    # Wait for user to stop
    while true; do
        sleep 1
    done
}

# Run main function
main "$@"
