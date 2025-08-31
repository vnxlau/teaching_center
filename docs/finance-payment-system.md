# Finance and Payment System Documentation

## Overview

The Teaching Center Finance and Payment System is designed to automate monthly payment generation for enrolled students while providing comprehensive payment tracking and management capabilities.

## Core Concepts

### 1. **Automatic Monthly Payment Generation**

The system automatically generates monthly payment records for all active students based on their enrollment status and membership plans.

#### Key Rules:
- **Payment Due Date**: All monthly payments are due on the **8th day** of each month
- **Automatic Generation**: Payments are automatically created for active students with valid membership plans
- **Enrollment-Based**: Payments continue monthly from enrollment date until membership is cancelled
- **No Manual Creation**: Admins don't need to manually create monthly payments for active students

#### Payment Generation Logic:
```
FOR each active student WITH membership plan:
  IF no payment exists for target month:
    CREATE payment record WITH:
      - Amount: student.monthlyDueAmount OR membershipPlan.monthlyPrice
      - Due Date: 8th of target month
      - Status: PENDING
      - Type: MONTHLY_FEE
      - Auto-generated note
  ELSE:
    SKIP (prevent duplicates)
```

### 2. **Payment Calculation**

Payment amounts are determined in the following priority order:

1. **Student's Custom Amount** (`monthlyDueAmount`): Individual amount set for specific students (includes discounts)
2. **Membership Plan Price** (`monthlyPrice`): Base price from the student's membership plan
3. **Fallback**: If neither exists, payment generation is skipped with error

#### Discount Application:
- Discounts are pre-calculated and stored in `student.monthlyDueAmount`
- The `discountRate` field tracks the discount percentage for reporting
- Custom amounts override membership plan prices

### 3. **Payment Status Lifecycle**

```
PENDING → PAID
   ↓
OVERDUE (if past due date and not paid)
   ↓
CANCELLED (manual admin action)
```

#### Status Definitions:
- **PENDING**: Payment created, awaiting payment
- **PAID**: Payment received and recorded
- **OVERDUE**: Payment past due date and still unpaid
- **CANCELLED**: Payment cancelled by admin (won't be collected)

### 4. **Payment Types**

- **MONTHLY_FEE**: Regular monthly tuition payments (auto-generated)
- **REGISTRATION_FEE**: One-time enrollment fees
- **EXAM_FEE**: Testing and examination fees
- **MATERIAL_FEE**: Books, supplies, equipment fees
- **OTHER**: Miscellaneous payments

## API Endpoints

### Automatic Payment Generation

#### `POST /api/admin/payments/auto-generate`

Generates monthly payments for all active students.

**Request Body:**
```json
{
  "targetMonth": 9,        // 1-12
  "targetYear": 2025,      // YYYY
  "schoolYearId": "xyz"    // School year ID
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment generation completed for September 2025",
  "summary": {
    "totalStudents": 45,
    "created": 42,
    "skipped": 3
  },
  "results": [
    {
      "studentId": "abc123",
      "studentName": "John Doe",
      "paymentId": "pay456",
      "amount": 150.00,
      "dueDate": "2025-09-08T00:00:00.000Z",
      "status": "created"
    }
  ]
}
```

#### `GET /api/admin/payments/auto-generate`

Check payment generation status for a specific month.

**Query Parameters:**
- `month`: Target month (1-12)
- `year`: Target year (YYYY)
- `schoolYearId`: School year ID

**Response:**
```json
{
  "month": 9,
  "year": 2025,
  "monthName": "September 2025",
  "activeStudentsCount": 45,
  "existingPaymentsCount": 42,
  "pendingGeneration": 3,
  "isComplete": false,
  "payments": [...]
}
```

### Regular Payment Management

#### `GET /api/admin/finance`
- Retrieve payment data with filtering options
- Supports monthly and school year views
- Status filtering (paid, pending, overdue)

#### `POST /api/admin/finance`
- Create individual payment records (non-monthly fees)
- Update payment status (mark as paid)

#### `PUT /api/admin/finance/[id]`
- Update existing payment records
- Modify amounts, dates, notes

## Database Schema

### Students Table
```sql
students (
  id               VARCHAR PRIMARY KEY,
  membershipPlanId VARCHAR REFERENCES membership_plans(id),
  monthlyDueAmount DECIMAL(10,2),  -- Custom amount (with discounts)
  discountRate     DECIMAL(5,2),   -- Discount percentage for reporting
  isActive         BOOLEAN,        -- Enrollment status
  schoolYearId     VARCHAR,        -- Academic year association
  enrollmentDate   TIMESTAMP,      -- Start of payment obligations
  ...
)
```

### Payments Table
```sql
payments (
  id           VARCHAR PRIMARY KEY,
  studentId    VARCHAR REFERENCES students(id),
  schoolYearId VARCHAR REFERENCES school_years(id),
  amount       DECIMAL(10,2),      -- Payment amount
  dueDate      TIMESTAMP,          -- When payment is due
  paidDate     TIMESTAMP,          -- When payment was received
  status       VARCHAR,            -- PENDING|PAID|OVERDUE|CANCELLED
  paymentType  VARCHAR,            -- MONTHLY_FEE|REGISTRATION_FEE|etc
  method       VARCHAR,            -- Payment method (Cash, Transfer, etc)
  reference    VARCHAR,            -- Receipt/reference number
  notes        TEXT,               -- Additional information
  ...
)
```

### Membership Plans Table
```sql
membership_plans (
  id           VARCHAR PRIMARY KEY,
  name         VARCHAR,            -- Plan name (e.g., "3 Days Plan")
  daysPerWeek  INTEGER,            -- Attendance days per week
  monthlyPrice DECIMAL(10,2),      -- Base monthly price
  isActive     BOOLEAN,            -- Plan availability
  ...
)
```

## Business Rules

### 1. **Monthly Payment Timeline**

```
Month Timeline:
Day 1-7:   Grace period (no overdue marking)
Day 8:     Payment due date
Day 9+:    Overdue if not paid
```

### 2. **Enrollment and Payment Obligations**

- **New Student**: Payments start from enrollment month
- **Active Student**: Continues monthly until membership cancelled
- **Inactive Student**: No new payments generated
- **Re-enrollment**: Payments resume from reactivation date

### 3. **Payment Generation Schedule**

**Recommended Schedule:**
- **End of Month**: Generate next month's payments
- **Monthly Trigger**: Automated job runs on last day of month
- **Manual Override**: Admin can generate payments any time

**Example Timeline:**
```
August 31: Generate September payments (due Sept 8)
September 30: Generate October payments (due Oct 8)
October 31: Generate November payments (due Nov 8)
```

### 4. **Duplicate Prevention**

The system prevents duplicate payments through:
- Database constraints
- API validation checks
- Monthly payment queries before generation

### 5. **Discount Handling**

- **Application**: Discounts calculated when setting `monthlyDueAmount`
- **Storage**: Both discount rate and final amount stored
- **Priority**: Custom amounts always override plan prices
- **Reporting**: Original plan price and discount visible in admin interface

## Dashboard Features

### Monthly Overview Section
- Current month payment statistics
- Interactive filtering by status
- Real-time payment tracking
- Visual status indicators (Blue/Green/Yellow/Red)

### School Year Overview Section  
- Academic year payment totals
- September to July period tracking
- Annual financial performance
- Visual status indicators (Purple/Emerald/Amber/Rose)

### Payment Management
- Search and filter payments
- Bulk status updates
- Payment method tracking
- Receipt reference management

## Implementation Example

### Monthly Payment Generation Workflow

```javascript
// 1. End of month automated trigger
async function generateNextMonthPayments() {
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  
  const result = await fetch('/api/admin/payments/auto-generate', {
    method: 'POST',
    body: JSON.stringify({
      targetMonth: nextMonth.getMonth() + 1,
      targetYear: nextMonth.getFullYear(),
      schoolYearId: getCurrentSchoolYearId()
    })
  })
  
  const response = await result.json()
  console.log(`Generated ${response.summary.created} payments`)
}

// 2. Check generation status before running
async function checkGenerationStatus(month, year) {
  const result = await fetch(
    `/api/admin/payments/auto-generate?month=${month}&year=${year}&schoolYearId=${schoolYearId}`
  )
  
  const status = await result.json()
  if (status.isComplete) {
    console.log('Payments already generated for this month')
    return false
  }
  return true
}
```

### Student Enrollment Process

```javascript
// When enrolling a new student
async function enrollStudent(studentData) {
  // 1. Create student record
  const student = await createStudent({
    ...studentData,
    membershipPlanId: selectedPlanId,
    monthlyDueAmount: calculateDiscountedAmount(basePlan.price, discount),
    discountRate: discount,
    isActive: true,
    enrollmentDate: new Date()
  })
  
  // 2. Generate current month payment if after 8th
  const today = new Date()
  if (today.getDate() <= 8) {
    await generatePaymentForStudent(student.id, today.getMonth() + 1, today.getFullYear())
  }
  
  // 3. Set up for next month's automatic generation
  // (Student will be included in monthly automated process)
}
```

## Error Handling

### Common Scenarios

1. **No Active Students**: Returns success with 0 created payments
2. **Duplicate Generation**: Skips existing payments, reports in results
3. **Invalid Amounts**: Skips students without valid payment amounts
4. **Database Errors**: Individual student failures don't stop batch processing
5. **Past Month Requests**: Rejected with validation error

### Error Response Format

```json
{
  "error": "Cannot create payments for past months",
  "details": "Validation failed for targetMonth parameter"
}
```

## Monitoring and Reporting

### Key Metrics to Track

- **Payment Generation Success Rate**: Created vs Total Students
- **Monthly Collection Rate**: Paid vs Generated payments
- **Overdue Analysis**: Payments past due date
- **Revenue Tracking**: Monthly and annual totals
- **Student Payment History**: Individual payment patterns

### Automated Alerts

- Failed payment generation runs
- High number of overdue payments
- Students with no valid payment amounts
- Monthly generation completion status

## Security Considerations

- **Role-Based Access**: Only ADMIN and STAFF can generate payments
- **Audit Trail**: All payment creation/updates logged
- **Data Validation**: Strict parameter validation on all endpoints
- **Idempotency**: Safe to retry payment generation operations

## Future Enhancements

1. **Automated Scheduling**: Cron job for monthly payment generation
2. **Email Notifications**: Payment due reminders and receipts
3. **Payment Gateway Integration**: Online payment processing
4. **Late Fee Calculation**: Automatic overdue penalty application
5. **Payment Plans**: Split payments and installment options
6. **Family Discounts**: Multi-student household discounts
7. **Seasonal Adjustments**: Holiday and summer break handling

---

This documentation covers the complete finance and payment system architecture, ensuring reliable automatic payment generation while maintaining flexibility for manual administrative tasks.
