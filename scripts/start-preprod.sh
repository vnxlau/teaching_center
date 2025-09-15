#!/bin/bash

# Teaching Center - Pre-Production Startup Script
# Runs production Docker image locally with Supabase database connection
# Perfect for testing production builds with real data

set -e

echo "🚀 Starting Teaching Center Pre-Production Environment..."
echo "📦 Using production image with Supabase database"
echo ""

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

# Function to check environment variables
check_env() {
    print_status "Checking pre-prod environment variables..."

    if [ ! -f .env.preprod ]; then
        print_error "Pre-prod environment file (.env.preprod) not found!"
        print_status "Please create .env.preprod based on .env.production"
        exit 1
    fi

    print_success "Pre-prod environment file found"

    # Source the environment file to check variables
    source .env.preprod

    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL is not set in .env.preprod"
        exit 1
    fi

    if [ -z "$NEXTAUTH_SECRET" ]; then
        print_error "NEXTAUTH_SECRET is not set in .env.preprod"
        exit 1
    fi

    print_success "Environment variables validated"
}

# Function to build production image
build_image() {
    print_status "Building production Docker image..."

    if ! docker build -f docker/Dockerfile -t teachingcenter:latest .; then
        print_error "Failed to build Docker image"
        exit 1
    fi

    print_success "Production image built successfully"
}

# Function to start services
start_services() {
    print_status "Starting pre-prod services..."

    # Stop any existing containers
    docker compose -f docker-compose.preprod.yml down 2>/dev/null || true

    # Start services
    if ! docker compose -f docker-compose.preprod.yml up -d; then
        print_error "Failed to start services"
        exit 1
    fi

    print_success "Pre-prod services started"
}

# Function to wait for services to be ready
wait_for_services() {
    print_status "Waiting for application to be ready..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
            print_success "Application is ready!"
            return 0
        fi

        print_status "Waiting... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done

    print_warning "Application may still be starting. Check logs with:"
    print_warning "docker-compose -f docker-compose.preprod.yml logs -f app"
}

# Function to show access information
show_info() {
    echo ""
    print_success "🎉 Pre-Production Environment Started!"
    echo ""
    echo "🌐 Application URL: http://localhost:3000"
    echo "📊 Environment: Pre-Production (with Supabase database)"
    echo "🐳 Docker Image: teachingcenter:latest"
    echo ""
    echo "📋 Useful commands:"
    echo "  • View logs: docker compose -f docker-compose.preprod.yml logs -f app"
    echo "  • Stop services: docker compose -f docker-compose.preprod.yml down"
    echo "  • Restart app: docker compose -f docker-compose.preprod.yml restart app"
    echo ""
    print_warning "⚠️  This environment uses your PRODUCTION Supabase database!"
    print_warning "   Be careful with data modifications during testing."
}

# Main execution
main() {
    check_docker
    check_env
    build_image
    start_services
    wait_for_services
    show_info
}

# Run main function
main "$@"