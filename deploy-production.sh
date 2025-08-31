#!/bin/bash

# Production Deployment Script for Teaching Center Management System
# This script handles database deployment to production environment

set -e  # Exit on any error

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

# Function to check if file exists
check_file() {
    if [ ! -f "$1" ]; then
        print_error "File $1 not found!"
        exit 1
    fi
}

# Function to load environment variables from .env.production
load_production_env() {
    print_status "Loading production environment variables..."
    
    if [ ! -f ".env.production" ]; then
        print_error ".env.production file not found!"
        print_status "Please create .env.production with your production database credentials"
        exit 1
    fi
    
    # Export variables from .env.production
    export $(grep -v '^#' .env.production | xargs)
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not found in .env.production"
        exit 1
    fi
    
    print_success "Production environment loaded"
}

# Function to check database connection
check_database_connection() {
    print_status "Checking database connection..."
    
    # Simple check - just verify the DATABASE_URL format
    if [[ "$DATABASE_URL" == postgresql* ]]; then
        print_success "Database URL format looks correct"
    else
        print_error "Invalid DATABASE_URL format"
        print_status "Expected: postgresql://user:pass@host:port/database"
        print_status "Current: ${DATABASE_URL:0:50}..."
        exit 1
    fi
}

# Function to deploy database schema
deploy_schema() {
    print_status "Deploying database schema..."
    
    # Backup current .env and use .env.production temporarily
    if [ -f ".env" ]; then
        cp .env .env.backup
    fi
    
    cp .env.production .env
    
    print_status "Generating Prisma client..."
    npx prisma generate
    
    print_status "Pushing schema to database..."
    npx prisma db push --force-reset
    
    # Restore original .env
    if [ -f ".env.backup" ]; then
        mv .env.backup .env
    else
        rm .env
    fi
    
    print_success "Database schema deployed successfully"
}

# Function to seed database
seed_database() {
    print_status "Seeding database with initial data..."
    
    # Backup current .env and use .env.production temporarily
    if [ -f ".env" ]; then
        cp .env .env.backup
    fi
    
    cp .env.production .env
    
    # Run seeding
    NODE_ENV=production npx prisma db seed
    
    # Restore original .env
    if [ -f ".env.backup" ]; then
        mv .env.backup .env
    else
        rm .env
    fi
    
    print_success "Database seeding completed"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Backup current .env and use .env.production temporarily
    if [ -f ".env" ]; then
        cp .env .env.backup
    fi
    
    cp .env.production .env
    
    # Simple verification - check if we can connect and basic tables exist
    print_status "Checking User table..."
    if npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\" LIMIT 1;" > /dev/null 2>&1; then
        print_success "User table exists and accessible"
    else
        print_warning "Could not verify User table"
    fi
    
    print_status "Checking Student table..."
    if npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Student\" LIMIT 1;" > /dev/null 2>&1; then
        print_success "Student table exists and accessible"
    else
        print_warning "Could not verify Student table"
    fi
    
    # Restore original .env
    if [ -f ".env.backup" ]; then
        mv .env.backup .env
    else
        rm .env
    fi
    
    print_success "Verification completed - check your Supabase dashboard for detailed data"
}

# Main function
main() {
    echo "🚀 Teaching Center Production Database Deployment"
    echo "=================================================="
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "prisma/schema.prisma" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    case "${1:-help}" in
        "deploy")
            print_status "Starting full production deployment..."
            load_production_env
            check_database_connection
            deploy_schema
            seed_database
            verify_deployment
            echo ""
            print_success "🎉 Production deployment completed successfully!"
            echo ""
            echo "📋 Next Steps:"
            echo "1. Deploy your application to Vercel"
            echo "2. Set environment variables in Vercel dashboard"
            echo "3. Test the application with demo accounts:"
            echo "   - Admin: admin@teachingcenter.com / demo123"
            echo "   - Teacher: teacher@teachingcenter.com / demo123"
            echo "   - Parent: parent@teachingcenter.com / demo123"
            echo "   - Student: student@teachingcenter.com / demo123"
            ;;
        "schema-only")
            print_status "Deploying schema only (no seeding)..."
            load_production_env
            check_database_connection
            deploy_schema
            print_success "Schema deployment completed"
            ;;
        "seed-only")
            print_status "Seeding database only..."
            load_production_env
            check_database_connection
            seed_database
            print_success "Database seeding completed"
            ;;
        "verify")
            print_status "Verifying production database..."
            load_production_env
            check_database_connection
            verify_deployment
            ;;
        "reset")
            print_warning "This will completely reset your production database!"
            read -p "Are you sure? Type 'yes' to continue: " confirm
            if [ "$confirm" = "yes" ]; then
                load_production_env
                check_database_connection
                deploy_schema
                seed_database
                verify_deployment
                print_success "Database reset completed"
            else
                print_status "Reset cancelled"
            fi
            ;;
        "help"|*)
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  deploy      - Full deployment (schema + seeding)"
            echo "  schema-only - Deploy schema without seeding"
            echo "  seed-only   - Seed database with demo data"
            echo "  verify      - Verify deployment status"
            echo "  reset       - Reset and redeploy everything (dangerous!)"
            echo "  help        - Show this help message"
            echo ""
            echo "Prerequisites:"
            echo "1. Create .env.production with your production database URL"
            echo "2. Ensure database is accessible and empty (for fresh deployment)"
            echo ""
            echo "Example .env.production:"
            echo 'DATABASE_URL="postgresql://user:pass@host:5432/dbname"'
            echo 'NEXTAUTH_URL="https://your-app.vercel.app"'
            echo 'NEXTAUTH_SECRET="your-secret"'
            ;;
    esac
}

# Run main function with all arguments
main "$@"
