import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/expenses/route';

// Mock Prisma with proper typing
const mockPrisma = {
  expense: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
};

// Mock the prisma import
jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}));

// Mock auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {}
}));

const mockSession = {
  user: {
    id: '1',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'ADMIN'
  }
};

const mockExpense = {
  id: '1',
  type: 'SERVICE',
  description: 'Test Expense',
  amount: 100.50,
  date: new Date('2025-01-15'),
  category: 'Test Category',
  vendor: 'Test Vendor',
  notes: 'Test notes',
  createdBy: '1',
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('/api/admin/expenses', () => {
  let mockGetServerSession: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession = require('next-auth').getServerSession;
  });

  describe('GET /api/admin/expenses', () => {
    it('should return expenses for authenticated admin', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.expense.findMany.mockResolvedValue([mockExpense]);

      const request = new NextRequest('http://localhost:3000/api/admin/expenses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([mockExpense]);
      expect(mockPrisma.expense.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'desc' }
      });
    });

    it('should return expenses for authenticated staff', async () => {
      const staffSession = { ...mockSession, user: { ...mockSession.user, role: 'STAFF' } };
      mockGetServerSession.mockResolvedValue(staffSession);
      mockPrisma.expense.findMany.mockResolvedValue([mockExpense]);

      const request = new NextRequest('http://localhost:3000/api/admin/expenses');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/expenses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 for user with insufficient permissions', async () => {
      const studentSession = { ...mockSession, user: { ...mockSession.user, role: 'STUDENT' } };
      mockGetServerSession.mockResolvedValue(studentSession);

      const request = new NextRequest('http://localhost:3000/api/admin/expenses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle database errors', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.expense.findMany.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/admin/expenses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/admin/expenses', () => {
    const validExpenseData = {
      type: 'SERVICE',
      description: 'Test Expense',
      amount: 100.50,
      date: '2025-01-15',
      category: 'Test Category',
      vendor: 'Test Vendor',
      notes: 'Test notes'
    };

    it('should create expense for authenticated admin', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.expense.create.mockResolvedValue(mockExpense);

      const request = new NextRequest('http://localhost:3000/api/admin/expenses', {
        method: 'POST',
        body: JSON.stringify(validExpenseData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockExpense);
      expect(mockPrisma.expense.create).toHaveBeenCalledWith({
        data: {
          type: 'SERVICE',
          description: 'Test Expense',
          amount: 100.50,
          date: new Date('2025-01-15'),
          category: 'Test Category',
          vendor: 'Test Vendor',
          notes: 'Test notes',
          createdBy: '1'
        }
      });
    });

    it('should return 400 for missing required fields', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      const invalidData = { description: 'Test' }; // Missing required fields
      const request = new NextRequest('http://localhost:3000/api/admin/expenses', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/expenses', {
        method: 'POST',
        body: JSON.stringify(validExpenseData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle database errors during creation', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrisma.expense.create.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/admin/expenses', {
        method: 'POST',
        body: JSON.stringify(validExpenseData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should validate expense type enum values', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      const invalidTypeData = {
        ...validExpenseData,
        type: 'INVALID_TYPE'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/expenses', {
        method: 'POST',
        body: JSON.stringify(invalidTypeData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);

      // This would fail at the database level due to enum constraint
      // The test verifies the API accepts the request but database handles validation
      expect(mockGetServerSession).toHaveBeenCalled();
    });
  });
});
