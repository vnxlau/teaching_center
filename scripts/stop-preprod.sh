#!/bin/bash

# Teaching Center - Stop Pre-Production Environment
# Stops the pre-prod Docker containers

set -e

echo "🛑 Stopping Teaching Center Pre-Production Environment..."

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to stop services
stop_services() {
    print_status "Stopping pre-prod services..."

    if ! docker compose -f docker-compose.preprod.yml down; then
        print_error "Failed to stop services"
        exit 1
    fi

    print_success "Pre-prod services stopped"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up unused Docker resources..."

    # Remove stopped containers
    docker container prune -f >/dev/null 2>&1

    # Remove unused images (optional, uncomment if needed)
    # docker image prune -f >/dev/null 2>&1

    print_success "Cleanup completed"
}

# Main execution
main() {
    stop_services
    cleanup
    echo ""
    print_success "✅ Pre-Production Environment Stopped!"
}

# Run main function
main "$@"