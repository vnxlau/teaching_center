#!/bin/bash

# Teaching Center Performance Optimization Script
# This script optimizes database performance and application caching

echo "🚀 Teaching Center Performance Optimization"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if database indexes file exists
if [ ! -f "scripts/add-indexes.sql" ]; then
    print_error "Database indexes file not found at scripts/add-indexes.sql"
    exit 1
fi

print_status "Starting performance optimization..."

# 1. Add database indexes
print_status "Adding database performance indexes..."
if [ -f ".env.production" ]; then
    print_status "Using production database for indexes..."
    
    # Backup current .env
    if [ -f ".env" ]; then
        cp .env .env.backup
    fi
    
    # Use production environment
    cp .env.production .env
    
    # Execute database indexes
    npx prisma db execute --file ./scripts/add-indexes.sql
    
    if [ $? -eq 0 ]; then
        print_success "Database indexes added successfully"
    else
        print_error "Failed to add database indexes"
    fi
    
    # Restore original .env
    if [ -f ".env.backup" ]; then
        mv .env.backup .env
    else
        rm .env
    fi
else
    print_warning "No .env.production found, skipping database optimization"
fi

# 2. Install performance dependencies
print_status "Installing performance optimization packages..."
npm install @tanstack/react-query @tanstack/react-query-devtools

if [ $? -eq 0 ]; then
    print_success "Performance packages installed"
else
    print_error "Failed to install performance packages"
fi

# 3. Build and analyze bundle
print_status "Analyzing bundle size..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully"
    
    # Show build info
    print_status "Build Analysis:"
    echo "📦 Check .next/static/chunks/ for bundle sizes"
    echo "📊 Use 'npm run build -- --debug' for detailed analysis"
else
    print_error "Build failed"
fi

# 4. Generate Prisma client optimized for production
print_status "Generating optimized Prisma client..."
npx prisma generate

if [ $? -eq 0 ]; then
    print_success "Prisma client generated"
else
    print_error "Failed to generate Prisma client"
fi

print_success "Performance optimization completed!"
print_status "Next steps:"
echo "  1. Deploy to Vercel with optimized build"
echo "  2. Monitor performance in Vercel Analytics"
echo "  3. Check Supabase Query Performance tab"
echo "  4. Test loading times on production"
echo ""
print_warning "Remember to:"
echo "  - Use React Query for client-side caching"
echo "  - Implement proper loading states"
echo "  - Optimize images with next/image"
echo "  - Use dynamic imports for heavy components"
