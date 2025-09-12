// Test utilities and helpers
import { jest } from '@jest/globals';

// Mock implementations for common testing scenarios

export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'STUDENT',
  student: {
    id: 'student1',
    firstName: 'John',
    lastName: 'Doe'
  },
  parent: null,
  staff: null
};

export const mockAdminUser = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'ADMIN',
  student: null,
  parent: null,
  staff: {
    id: 'staff1',
    firstName: 'Admin',
    lastName: 'User',
    department: 'Administration'
  }
};

export const mockSession = {
  user: mockUser,
  expires: '2025-12-31'
};

export const mockAdminSession = {
  user: mockAdminUser,
  expires: '2025-12-31'
};

// Mock API response creators
export const createMockResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data)
});

export const createMockErrorResponse = (error: string, status = 500) => ({
  ok: false,
  status,
  json: () => Promise.resolve({ error })
});

// Database mock helpers
export const mockPrismaClient = {
  $queryRaw: jest.fn(),
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  expense: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  student: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  studentParent: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  systemSettings: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
};

// Test data factories
export const createMockExpense = (overrides = {}) => ({
  id: 'expense1',
  type: 'SERVICE',
  description: 'Test Expense',
  amount: 100.50,
  date: new Date('2025-01-15'),
  category: 'Test Category',
  vendor: 'Test Vendor',
  notes: 'Test notes',
  createdBy: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockStudent = (overrides = {}) => ({
  id: 'student1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  address: '123 Main St',
  dateOfBirth: new Date('2010-01-01'),
  enrollmentDate: new Date('2024-09-01'),
  schoolYearId: 'year1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Custom matchers
expect.extend({
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      message: () => `expected ${received} to be a valid Date`,
      pass
    };
  },

  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass
    };
  }
});

// Test setup helpers
export const setupMockPrisma = () => {
  jest.mock('@/lib/prisma', () => ({
    prisma: mockPrismaClient
  }));
};

export const resetAllMocks = () => {
  Object.values(mockPrismaClient).forEach(model => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach(method => {
        if (typeof method === 'function' && method.mockReset) {
          method.mockReset();
        }
      });
    }
  });
};

// Common test scenarios
export const commonTestScenarios = {
  async successfulOperation(mockFn: any, result: any) {
    mockFn.mockResolvedValue(result);
  },

  async failedOperation(mockFn: any, error: Error) {
    mockFn.mockRejectedValue(error);
  },

  async notFoundOperation(mockFn: any) {
    mockFn.mockResolvedValue(null);
  }
};
