#!/bin/bash

# Teaching Center - Local Development Stop Script
# This script stops all running services started by start-local.sh

set -e

echo "🛑 Stopping Teaching Center Local Development..."

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
    if ! docker info >/dev/null 2>&1; then
        print_warning "Docker is not running. Skipping Docker container cleanup."
        return 1
    fi
    return 0
}

# Function to stop Next.js development server
stop_nextjs() {
    print_status "Stopping Next.js development server..."

    # Find and kill Next.js processes
    local nextjs_pids=$(ps aux | grep -E "(next dev|next-server)" | grep -v grep | awk '{print $2}')

    if [ -n "$nextjs_pids" ]; then
        echo "$nextjs_pids" | while read -r pid; do
            if kill -TERM "$pid" 2>/dev/null; then
                print_status "Sent TERM signal to Next.js process (PID: $pid)"
            else
                print_warning "Failed to send TERM signal to PID: $pid"
            fi
        done

        # Wait a bit for graceful shutdown
        sleep 3

        # Force kill any remaining processes
        echo "$nextjs_pids" | while read -r pid; do
            if ps -p "$pid" >/dev/null 2>&1; then
                if kill -KILL "$pid" 2>/dev/null; then
                    print_warning "Force killed Next.js process (PID: $pid)"
                fi
            fi
        done

        print_success "Next.js development server stopped"
    else
        print_status "No Next.js processes found"
    fi
}

# Function to stop PostCSS processes
stop_postcss() {
    print_status "Stopping PostCSS processes..."

    local postcss_pids=$(ps aux | grep "postcss" | grep -v grep | awk '{print $2}')

    if [ -n "$postcss_pids" ]; then
        echo "$postcss_pids" | while read -r pid; do
            if kill -TERM "$pid" 2>/dev/null; then
                print_status "Sent TERM signal to PostCSS process (PID: $pid)"
            fi
        done

        # Wait a bit
        sleep 2

        # Force kill if needed
        echo "$postcss_pids" | while read -r pid; do
            if ps -p "$pid" >/dev/null 2>&1; then
                if kill -KILL "$pid" 2>/dev/null; then
                    print_warning "Force killed PostCSS process (PID: $pid)"
                fi
            fi
        done

        print_success "PostCSS processes stopped"
    else
        print_status "No PostCSS processes found"
    fi
}

# Function to stop Docker containers
stop_docker_containers() {
    print_status "Stopping Docker containers..."

    if check_docker; then
        # Stop containers defined in docker-compose.db-only.yml
        if [ -f "docker-compose.db-only.yml" ]; then
            if docker compose -f docker-compose.db-only.yml ps --services --filter "status=running" | grep -q .; then
                print_status "Stopping database containers..."
                docker compose -f docker-compose.db-only.yml down
                print_success "Database containers stopped"
            else
                print_status "No running database containers found"
            fi
        else
            print_warning "docker-compose.db-only.yml not found"
        fi

        # Also check for any other containers that might be related
        local teaching_containers=$(docker ps --filter "name=teaching" --format "{{.Names}}")
        if [ -n "$teaching_containers" ]; then
            print_status "Found additional containers: $teaching_containers"
            echo "$teaching_containers" | while read -r container; do
                print_status "Stopping container: $container"
                docker stop "$container" >/dev/null 2>&1
            done
            print_success "Additional containers stopped"
        fi
    fi
}

# Function to stop processes on specific ports
stop_port_processes() {
    print_status "Checking for processes on development ports..."

    local ports=(3000 3001 3002 8080)

    for port in "${ports[@]}"; do
        local pid=$(lsof -ti:"$port" 2>/dev/null)
        if [ -n "$pid" ]; then
            print_status "Found process on port $port (PID: $pid)"
            if kill -TERM "$pid" 2>/dev/null; then
                print_status "Sent TERM signal to process on port $port"
            else
                print_warning "Failed to stop process on port $port"
            fi
        fi
    done
}

# Function to clean up temporary files
cleanup_temp_files() {
    print_status "Cleaning up temporary files..."

    # Remove Next.js build cache if it exists
    if [ -d ".next" ]; then
        print_status "Removing .next build cache..."
        rm -rf .next
        print_success "Build cache cleaned"
    fi

    # Remove any .turbo cache if it exists
    if [ -d ".turbo" ]; then
        print_status "Removing .turbo cache..."
        rm -rf .turbo
        print_success "Turbo cache cleaned"
    fi
}

# Function to show final status
show_status() {
    print_status "Checking final status..."

    # Check if any related processes are still running
    local remaining_processes=$(ps aux | grep -E "(next|postcss|teaching)" | grep -v grep | wc -l)

    if [ "$remaining_processes" -gt 0 ]; then
        print_warning "Some processes may still be running:"
        ps aux | grep -E "(next|postcss|teaching)" | grep -v grep
    else
        print_success "All processes stopped successfully"
    fi

    # Check Docker containers
    if check_docker && docker ps --filter "name=teaching" --format "{{.Names}}" | grep -q .; then
        print_warning "Some Docker containers may still be running:"
        docker ps --filter "name=teaching"
    else
        print_success "All Docker containers stopped"
    fi

    # Check ports
    local ports=(3000 3001 3002 8080)
    local ports_in_use=()

    for port in "${ports[@]}"; do
        if lsof -i:"$port" >/dev/null 2>&1; then
            ports_in_use+=("$port")
        fi
    done

    if [ ${#ports_in_use[@]} -gt 0 ]; then
        print_warning "Ports still in use: ${ports_in_use[*]}"
    else
        print_success "All development ports are free"
    fi
}

# Function to force stop everything (nuclear option)
force_stop_all() {
    print_warning "Force stopping all related processes..."

    # Kill all Node.js processes
    pkill -9 -f "node.*next" 2>/dev/null || true
    pkill -9 -f "postcss" 2>/dev/null || true

    # Kill all npm processes
    pkill -9 -f "npm" 2>/dev/null || true

    # Stop all Docker containers with teaching in name
    if check_docker; then
        docker ps --filter "name=teaching" --format "{{.Names}}" | xargs -r docker stop 2>/dev/null || true
    fi

    print_success "Force stop completed"
}

# Main execution
main() {
    local force=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force|-f)
                force=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Stop Teaching Center local development environment"
                echo ""
                echo "Options:"
                echo "  -f, --force    Force stop all processes (nuclear option)"
                echo "  -h, --help     Show this help message"
                echo ""
                echo "This script will:"
                echo "  - Stop Next.js development server"
                echo "  - Stop PostCSS processes"
                echo "  - Stop Docker containers"
                echo "  - Clean up temporary files"
                echo "  - Check for remaining processes"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    if [ "$force" = true ]; then
        force_stop_all
        show_status
        exit 0
    fi

    stop_nextjs
    stop_postcss
    stop_docker_containers
    stop_port_processes
    cleanup_temp_files
    show_status

    print_success "Teaching Center local development stopped successfully!"
    print_status "You can restart with: ./start-local.sh"
}

# Run main function
main "$@"
