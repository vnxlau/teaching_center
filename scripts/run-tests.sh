#!/bin/bash

# Comprehensive Test Runner Script
# This script runs all tests with proper setup and reporting

set -e

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

# Function to check if database is running
check_database() {
    print_status "Checking database connection..."
    if ! npm run local:db:stop 2>/dev/null; then
        print_warning "Database not running, starting it..."
        npm run local:db:start
        sleep 10
    fi
    print_success "Database is ready"
}

# Function to run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    if npm run test:unit; then
        print_success "Unit tests passed"
    else
        print_error "Unit tests failed"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    if npm run test:integration; then
        print_success "Integration tests passed"
    else
        print_error "Integration tests failed"
        return 1
    fi
}

# Function to run all tests
run_all_tests() {
    print_status "Running all tests..."
    if npm run test:all; then
        print_success "All tests passed"
    else
        print_error "Some tests failed"
        return 1
    fi
}

# Function to generate coverage report
generate_coverage() {
    print_status "Generating test coverage report..."
    if npm run test:coverage; then
        print_success "Coverage report generated"
        print_status "Coverage report available at: coverage/lcov-report/index.html"
    else
        print_error "Failed to generate coverage report"
        return 1
    fi
}

# Function to run tests in watch mode
run_watch_mode() {
    print_status "Running tests in watch mode..."
    print_status "Press 'q' to quit watch mode"
    npm run test:watch
}

# Function to clean test cache
clean_test_cache() {
    print_status "Cleaning test cache..."
    npx jest --clearCache
    print_success "Test cache cleaned"
}

# Function to show test statistics
show_test_stats() {
    print_status "Test Statistics:"

    # Count test files
    UNIT_TESTS=$(find tests/unit -name "*.test.*" -o -name "*.spec.*" | wc -l)
    INTEGRATION_TESTS=$(find tests/integration -name "*.test.*" -o -name "*.spec.*" | wc -l)
    E2E_TESTS=$(find tests/e2e -name "*.test.*" -o -name "*.spec.*" | wc -l)

    echo "Unit Tests: $UNIT_TESTS files"
    echo "Integration Tests: $INTEGRATION_TESTS files"
    echo "E2E Tests: $E2E_TESTS files"
    echo "Total Test Files: $((UNIT_TESTS + INTEGRATION_TESTS + E2E_TESTS))"
}

# Main script logic
case "${1:-all}" in
    "unit")
        run_unit_tests
        ;;
    "integration")
        check_database
        run_integration_tests
        ;;
    "coverage")
        generate_coverage
        ;;
    "watch")
        run_watch_mode
        ;;
    "clean")
        clean_test_cache
        ;;
    "stats")
        show_test_stats
        ;;
    "all")
        check_database
        run_all_tests
        generate_coverage
        ;;
    "setup")
        print_status "Setting up test environment..."
        npm install
        check_database
        print_success "Test environment setup complete"
        show_test_stats
        ;;
    *)
        echo "Usage: $0 [unit|integration|coverage|watch|clean|stats|all|setup]"
        echo ""
        echo "Commands:"
        echo "  unit         - Run unit tests only"
        echo "  integration  - Run integration tests only"
        echo "  coverage     - Generate coverage report"
        echo "  watch        - Run tests in watch mode"
        echo "  clean        - Clean test cache"
        echo "  stats        - Show test statistics"
        echo "  all          - Run all tests with coverage (default)"
        echo "  setup        - Setup test environment"
        exit 1
        ;;
esac

print_success "Test execution completed!"
