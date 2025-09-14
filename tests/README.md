# Teaching Center - End-to-End Tests

This directory contains comprehensive end-to-end tests for the Teaching Center Management System using Playwright.

## Test Structure

```
tests/e2e/
├── auth.spec.ts          # Authentication and login tests
├── students.spec.ts      # Student management tests
├── finance.spec.ts       # Financial management tests (payments, expenses, business dashboard)
├── academic.spec.ts      # Academic management tests (subjects, tests, grades)
├── attendance.spec.ts    # Attendance tracking tests
├── messaging.spec.ts     # Messaging system tests
└── settings.spec.ts      # Admin settings and configuration tests
```

## Prerequisites

1. **Database Setup**: Ensure the PostgreSQL database is running and seeded with sample data
2. **Environment Variables**: Copy `.env.local` with proper database connection
3. **Dependencies**: Install all dependencies with `npm install`

## Running Tests

### Start the Application and Database

```bash
# Start local development environment
npm run local:start

# Or start database separately
npm run local:db:start
npm run dev
```

### Run All Tests

```bash
npm test
```

### Run Tests with UI

```bash
npm run test:ui
```

### Run Tests in Headed Mode (visible browser)

```bash
npm run test:headed
```

### Debug Tests

```bash
npm run test:debug
```

### View Test Reports

```bash
npm run test:report
```

## Test Accounts

The tests use the following demo accounts:

- **Admin**: `admin@teachingcenter.com` / `demo123`
- **Teacher**: `teacher@teachingcenter.com` / `demo123`
- **Parent**: `parent@teachingcenter.com` / `demo123`
- **Student**: `student@teachingcenter.com` / `demo123`

## Test Coverage

### Authentication Tests (`auth.spec.ts`)
- Login page loading
- Admin, teacher, parent, and student login
- Invalid credentials handling
- Protected route access control

### Student Management Tests (`students.spec.ts`)
- Students list display
- Student search and filtering
- Student detail page navigation
- Attendance logging
- Note management
- Test score visualization

### Financial Management Tests (`finance.spec.ts`)
- Payments page functionality
- Expenses page functionality
- Business dashboard overview
- Payment filtering and search
- Expense management

### Academic Management Tests (`academic.spec.ts`)
- Academic dashboard
- Subject management
- Test creation and management
- Grade tracking
- Academic data export

### Attendance Tests (`attendance.spec.ts`)
- Attendance dashboard
- Daily attendance logging
- Attendance history
- Attendance statistics
- Data export

### Messaging Tests (`messaging.spec.ts`)
- Message composition
- Message sending (to students and parents)
- Message inbox management
- Message search and filtering
- Message deletion

### Settings Tests (`settings.spec.ts`)
- System settings configuration
- User profile management
- Password changes
- Notification preferences
- Security settings
- Integration configuration
- Audit logging

## Browser Support

Tests run on:
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)
- Mobile Chrome
- Mobile Safari

## CI/CD Integration

The tests are configured to work with CI/CD pipelines:
- Automatic retries on failure
- Parallel test execution
- Trace collection for debugging
- HTML reports generation

## Writing New Tests

When adding new tests:

1. Follow the existing naming convention: `feature.spec.ts`
2. Use descriptive test names
3. Include proper assertions
4. Handle async operations correctly
5. Clean up test data when necessary

Example test structure:

```typescript
test('should perform action', async ({ page }) => {
  // Arrange
  await page.goto('/some-page');

  // Act
  await page.click('button');

  // Assert
  await expect(page.locator('result')).toBeVisible();
});
```

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure database is running and accessible
2. **Port Conflicts**: Make sure port 3001 is available
3. **Test Timeouts**: Increase timeout for slow operations
4. **Flaky Tests**: Use proper wait strategies and retries

### Debug Mode

Run tests in debug mode to step through execution:

```bash
npm run test:debug
```

This opens a browser where you can inspect the application state during test execution.