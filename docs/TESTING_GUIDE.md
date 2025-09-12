# Testing Guide

This document provides comprehensive information about the testing setup and practices for the Teaching Center Management System.

## 🧪 Testing Overview

The project uses a multi-layered testing approach with **Jest** for unit and integration tests, and **Playwright** for end-to-end testing.

### Testing Pyramid

```
End-to-End Tests (E2E)     ── Playwright
    │
Integration Tests           ── Jest + Supertest
    │
Unit Tests                  ── Jest + React Testing Library
```

## 📁 Test Structure

```
tests/
├── unit/                   # Unit tests for components and utilities
├── integration/           # API integration tests
├── e2e/                   # End-to-end tests (Playwright)
└── utils/                 # Test utilities and helpers
```

## 🚀 Quick Start

### Run All Tests
```bash
npm test
# or
./scripts/run-tests.sh all
```

### Run Specific Test Types
```bash
# Unit tests only
npm run test:unit
./scripts/run-tests.sh unit

# Integration tests only
npm run test:integration
./scripts/run-tests.sh integration

# End-to-end tests
npm run test:e2e
```

### Development Mode
```bash
# Watch mode for continuous testing
npm run test:watch
./scripts/run-tests.sh watch

# Generate coverage report
npm run test:coverage
./scripts/run-tests.sh coverage
```

## 📊 Test Coverage

### Current Coverage Goals
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 85%
- **Lines**: > 80%

### Coverage Report
```bash
npm run test:coverage
```
Reports are generated in `coverage/lcov-report/index.html`

## 🛠️ Test Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (for integration tests)
- All dependencies installed

### Environment Setup
```bash
# Install dependencies
npm install

# Setup test database
npm run local:db:start
npm run local:db:setup

# Run setup script
./scripts/run-tests.sh setup
```

## 📝 Writing Tests

### Unit Tests

#### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked!')).toBeInTheDocument();
  });
});
```

#### Utility Function Testing
```typescript
import { formatCurrency } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats numbers as currency', () => {
    expect(formatCurrency(1234.56)).toBe('€1,234.56');
    expect(formatCurrency(0)).toBe('€0.00');
  });

  it('handles negative values', () => {
    expect(formatCurrency(-100)).toBe('-€100.00');
  });
});
```

### Integration Tests

#### API Testing
```typescript
import { GET, POST } from '@/app/api/admin/expenses/route';
import { mockPrismaClient, mockAdminSession } from '../../../utils/test-helpers';

describe('/api/admin/expenses', () => {
  it('returns expenses for authenticated admin', async () => {
    // Mock authentication
    mockGetServerSession.mockResolvedValue(mockAdminSession);

    // Mock database
    mockPrismaClient.expense.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/admin/expenses');
    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});
```

### End-to-End Tests

#### Playwright Testing
```typescript
import { test, expect } from '@playwright/test';

test.describe('Expenses Dashboard', () => {
  test('should create new expense', async ({ page }) => {
    await page.goto('/admin/expenses');

    // Fill form
    await page.fill('input[name="description"]', 'Test Expense');
    await page.fill('input[name="amount"]', '100.00');

    // Submit
    await page.click('button[type="submit"]');

    // Verify
    await expect(page.locator('text=Expense created')).toBeVisible();
  });
});
```

## 🧰 Test Utilities

### Common Helpers

#### Mock Data Factories
```typescript
import { createMockExpense, createMockUser } from '../utils/test-helpers';

const mockExpense = createMockExpense({
  description: 'Custom Expense',
  amount: 250.00
});
```

#### API Response Mocks
```typescript
import { createMockResponse, createMockErrorResponse } from '../utils/test-helpers';

const successResponse = createMockResponse({ data: 'test' });
const errorResponse = createMockErrorResponse('Not found', 404);
```

#### Authentication Mocks
```typescript
import { mockAdminSession, mockUser } from '../utils/test-helpers';

// Use in tests
mockGetServerSession.mockResolvedValue(mockAdminSession);
```

## 🎯 Test Categories

### 1. Component Tests
- **Location**: `tests/unit/components/`
- **Purpose**: Test React components in isolation
- **Tools**: React Testing Library, Jest

### 2. Utility Tests
- **Location**: `tests/unit/utils/`
- **Purpose**: Test pure functions and utilities
- **Tools**: Jest

### 3. API Integration Tests
- **Location**: `tests/integration/`
- **Purpose**: Test API endpoints with database
- **Tools**: Jest, Supertest

### 4. End-to-End Tests
- **Location**: `tests/e2e/`
- **Purpose**: Test complete user workflows
- **Tools**: Playwright

## 📋 Test Checklist

### Before Writing Tests
- [ ] Identify what to test (component, function, API)
- [ ] Determine test type (unit, integration, e2e)
- [ ] Set up necessary mocks
- [ ] Plan test scenarios (happy path, error cases)

### Test Structure
- [ ] **Arrange**: Set up test data and mocks
- [ ] **Act**: Execute the code being tested
- [ ] **Assert**: Verify expected behavior
- [ ] **Cleanup**: Reset mocks and state

### Test Coverage
- [ ] Happy path scenarios
- [ ] Error handling
- [ ] Edge cases
- [ ] Loading states
- [ ] User interactions

## 🔧 Configuration

### Jest Configuration
Located in `jest.config.ts`:
- Test environment: jsdom
- Setup files: `jest.setup.ts`
- Coverage settings
- Module aliases

### Playwright Configuration
Located in `playwright.config.ts`:
- Browser settings
- Base URL configuration
- Test timeouts
- Parallel execution

## 🚨 Common Issues & Solutions

### Mocking Issues
```typescript
// Problem: Mock not working
const mockFn = jest.fn();

// Solution: Properly type the mock
const mockFn = jest.fn() as jest.MockedFunction<typeof originalFunction>;
```

### Async Testing
```typescript
// Problem: Async operations not waiting
it('should handle async operations', async () => {
  // Solution: Use async/await and waitFor
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### Database Testing
```typescript
// Problem: Database state pollution
beforeEach(async () => {
  // Solution: Clean database before each test
  await prisma.expense.deleteMany();
});
```

## 📈 Best Practices

### Naming Conventions
```typescript
// Good
describe('ExpenseForm', () => {
  it('validates required fields', () => { ... });
  it('submits successfully with valid data', () => { ... });
});

// Avoid
describe('Test Expense Form', () => {
  it('test 1', () => { ... });
  it('should work', () => { ... });
});
```

### Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names
- Keep tests focused on single responsibility
- Use `beforeEach` for common setup

### Mock Strategy
- Mock external dependencies (API calls, database)
- Use realistic mock data
- Avoid over-mocking (test the actual logic)
- Reset mocks between tests

## 📊 Continuous Integration

### GitHub Actions Setup
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
```

## 🎯 Testing Goals

### Immediate Goals (Next Sprint)
- [ ] Achieve 80% code coverage
- [ ] Test all critical user paths
- [ ] Implement visual regression testing
- [ ] Add performance testing

### Long-term Goals
- [ ] 95%+ code coverage
- [ ] Automated accessibility testing
- [ ] Cross-browser compatibility testing
- [ ] Load testing for critical endpoints

## 📚 Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)

### Tools
- [Jest Cheat Sheet](https://github.com/sapegin/jest-cheat-sheet)
- [Testing Library Cheat Sheet](https://testing-library.com/docs/react-testing-library/cheatsheet/)

---

## 📞 Support

For testing questions or issues:
1. Check existing test examples
2. Review the test utilities in `tests/utils/`
3. Run `./scripts/run-tests.sh stats` for test statistics
4. Check coverage reports for gaps

Happy Testing! 🧪
