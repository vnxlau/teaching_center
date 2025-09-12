#!/bin/bash

# Teaching Center - Production Startup Script
# This script starts the full application stack using Docker containers

set -e

echo "🚀 Starting Teaching Center Production Environment..."

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
    if ! sudo docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check environment variables
check_env() {
    print_status "Checking environment variables..."
    
    if [ -f .env.production ]; then
        print_success "Production environment file found"
        source .env.production
    else
        print_warning "No .env.production file found, using defaults"
    fi
    
    # Set defaults if not provided
    export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-"secure_production_password_123"}
    export NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-"$(openssl rand -base64 32)"}
    export NEXTAUTH_URL=${NEXTAUTH_URL:-"http://localhost:3000"}
    
    print_success "Environment variables configured"
}

# Function to build and start production
start_production() {
    print_status "Building and starting production containers..."
    
    # Build and start all services
    sudo docker compose up --build -d
    
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check if services are running
    if sudo docker compose ps --format "table {{.Service}}\t{{.Status}}" | grep -q "Up"; then
        print_success "Production environment started successfully!"
        print_status "Application available at: $NEXTAUTH_URL"
        print_status "Database admin at: http://localhost:8080"
        print_status "Check logs with: sudo docker compose logs -f"
        print_status "Stop with: sudo docker compose down"
    else
        print_error "Failed to start production environment"
        sudo docker compose logs
        exit 1
    fi
}

# Function to show status
show_status() {
    print_status "Production environment status:"
    sudo docker compose ps
    echo ""
    print_status "Container logs (last 20 lines):"
    sudo docker compose logs --tail=20
}

# Main execution
main() {
    case "${1:-start}" in
        "start")
            check_docker
            check_env
            start_production
            ;;
        "stop")
            print_status "Stopping production environment..."
            sudo docker compose down
            print_success "Production environment stopped"
            ;;
        "restart")
            print_status "Restarting production environment..."
            sudo docker compose down
            check_docker
            check_env
            start_production
            ;;
        "status")
            show_status
            ;;
        "logs")
            sudo docker compose logs -f
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|status|logs}"
            echo "  start   - Start production environment (default)"
            echo "  stop    - Stop production environment"
            echo "  restart - Restart production environment"
            echo "  status  - Show status and logs"
            echo "  logs    - Follow logs"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
