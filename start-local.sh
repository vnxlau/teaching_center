#!/bin/bash

# Teaching Center - Local Development Startup Script
# This script starts the PostgreSQL database and Next.js app for local development

set -e

echo "🚀 Starting Teaching Center Local Development..."

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
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -i:$port >/dev/null 2>&1; then
        print_warning "Port $port is already in use"
        return 1
    fi
    return 0
}

# Function to start database
start_database() {
    print_status "Starting PostgreSQL database container..."
    
    # Start the database container
    docker compose -f docker-compose.db-only.yml up -d
    
    print_status "Waiting for database to be ready..."
    
    # Wait for the database to be healthy
    local retries=30
    while [ $retries -gt 0 ]; do
        if docker compose -f docker-compose.db-only.yml ps --format "table {{.Service}}\t{{.Status}}" | grep -q "healthy"; then
            print_success "Database is ready!"
            break
        fi
        
        echo -n "."
        sleep 2
        ((retries--))
    done
    
    if [ $retries -eq 0 ]; then
        print_error "Database failed to start properly"
        docker compose -f docker-compose.db-only.yml logs postgres
        exit 1
    fi
}

# Function to setup database schema
setup_database() {
    print_status "Setting up database schema..."
    
    # Generate Prisma client
    npx prisma generate
    
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

# Function to start application
start_app() {
    print_status "Starting Next.js application on port 3001..."
    
    # Check if port 3001 is available
    if ! check_port 3001; then
        print_warning "Port 3001 is in use. The app may not start properly."
    fi
    
    print_success "Starting development server..."
    print_status "App will be available at: http://localhost:3001"
    print_status "Database admin at: http://localhost:8080"
    print_status "Press Ctrl+C to stop all services"
    
    # Start the Next.js development server
    npm run dev
}

# Function to cleanup on exit
cleanup() {
    print_status "Stopping services..."
    docker compose -f docker-compose.db-only.yml down
    print_success "Cleanup complete"
}

# Set trap to cleanup on script exit
trap cleanup EXIT

# Main execution
main() {
    check_docker
    start_database
    setup_database
    start_app
}

# Run main function
main "$@"
