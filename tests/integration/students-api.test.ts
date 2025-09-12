import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/students/route';
import { mockPrismaClient, mockAdminSession, createMockResponse, createMockErrorResponse } from '../utils/test-helpers';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

// Mock auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {}
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: mockPrismaClient
}));

const mockGetServerSession = require('next-auth').getServerSession;

describe('/api/admin/students', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/students', () => {
    const mockStudentsRaw = [
      {
        id: 'student1',
        studentCode: 'STU001',
        firstName: 'John',
        lastName: 'Doe',
        grade: 'Grade 10',
        isActive: true,
        enrollmentDate: new Date('2024-09-01'),
        monthlyDueAmount: 150.00,
        discountRate: 0,
        email: 'john.doe@example.com',
        membershipPlanId: 'plan1',
        membershipPlanName: 'Standard Plan',
        membershipPlanDaysPerWeek: 5,
        membershipPlanMonthlyPrice: 150.00
      },
      {
        id: 'student2',
        studentCode: 'STU002',
        firstName: 'Jane',
        lastName: 'Smith',
        grade: 'Grade 9',
        isActive: true,
        enrollmentDate: new Date('2024-09-01'),
        monthlyDueAmount: 140.00,
        discountRate: 5,
        email: 'jane.smith@example.com',
        membershipPlanId: 'plan2',
        membershipPlanName: 'Premium Plan',
        membershipPlanDaysPerWeek: 6,
        membershipPlanMonthlyPrice: 180.00
      }
    ];

    const mockParentRelations = [
      {
        id: 'relation1',
        studentId: 'student1',
        parentId: 'parent1',
        relationship: 'Father',
        isPrimary: true,
        parent: {
          id: 'parent1',
          firstName: 'Michael',
          lastName: 'Doe',
          email: 'michael.doe@example.com',
          phone: '+1234567890'
        }
      }
    ];

    it('should return students list for authenticated admin', async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession);
      mockPrismaClient.$queryRaw.mockResolvedValue(mockStudentsRaw);
      mockPrismaClient.studentParent.findMany.mockResolvedValue(mockParentRelations);

      const request = new NextRequest('http://localhost:3000/api/admin/students');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.students).toBeDefined();
      expect(data.students).toHaveLength(2);
      expect(data.students[0]).toMatchObject({
        id: 'student1',
        studentCode: 'STU001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com'
      });
    });

    it('should return students list for authenticated staff', async () => {
      const staffSession = {
        ...mockAdminSession,
        user: { ...mockAdminSession.user, role: 'STAFF' }
      };

      mockGetServerSession.mockResolvedValue(staffSession);
      mockPrismaClient.$queryRaw.mockResolvedValue(mockStudentsRaw);
      mockPrismaClient.studentParent.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/admin/students');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/students');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for user with insufficient permissions', async () => {
      const studentSession = {
        ...mockAdminSession,
        user: { ...mockAdminSession.user, role: 'STUDENT' }
      };

      mockGetServerSession.mockResolvedValue(studentSession);

      const request = new NextRequest('http://localhost:3000/api/admin/students');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Access denied');
    });

    it('should include parent information when available', async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession);
      mockPrismaClient.$queryRaw.mockResolvedValue([mockStudentsRaw[0]]);
      mockPrismaClient.studentParent.findMany.mockResolvedValue(mockParentRelations);

      const request = new NextRequest('http://localhost:3000/api/admin/students');
      const response = await GET(request);
      const data = await response.json();

      expect(data.students[0].parents).toBeDefined();
      expect(data.students[0].parents[0]).toMatchObject({
        id: 'parent1',
        firstName: 'Michael',
        lastName: 'Doe',
        relationship: 'Father',
        isPrimary: true
      });
    });

    it('should include membership plan information', async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession);
      mockPrismaClient.$queryRaw.mockResolvedValue([mockStudentsRaw[0]]);
      mockPrismaClient.studentParent.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/admin/students');
      const response = await GET(request);
      const data = await response.json();

      expect(data.students[0].membershipPlan).toMatchObject({
        id: 'plan1',
        name: 'Standard Plan',
        daysPerWeek: 5,
        monthlyPrice: 150.00
      });
    });

    it('should handle students without membership plans', async () => {
      const studentWithoutPlan = {
        ...mockStudentsRaw[0],
        membershipPlanId: null,
        membershipPlanName: null,
        membershipPlanDaysPerWeek: null,
        membershipPlanMonthlyPrice: null
      };

      mockGetServerSession.mockResolvedValue(mockAdminSession);
      mockPrismaClient.$queryRaw.mockResolvedValue([studentWithoutPlan]);
      mockPrismaClient.studentParent.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/admin/students');
      const response = await GET(request);
      const data = await response.json();

      expect(data.students[0].membershipPlan).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession);
      mockPrismaClient.$queryRaw.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/students');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle empty students list', async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession);
      mockPrismaClient.$queryRaw.mockResolvedValue([]);
      mockPrismaClient.studentParent.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/admin/students');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.students).toEqual([]);
    });

    it('should calculate effective monthly amount with discount', async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession);
      mockPrismaClient.$queryRaw.mockResolvedValue([mockStudentsRaw[1]]); // Student with 5% discount
      mockPrismaClient.studentParent.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/admin/students');
      const response = await GET(request);
      const data = await response.json();

      // 140.00 base amount with 5% discount = 133.00
      expect(data.students[0].effectiveMonthlyAmount).toBe(133.00);
    });

    it('should handle students with zero discount rate', async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession);
      mockPrismaClient.$queryRaw.mockResolvedValue([mockStudentsRaw[0]]); // Student with 0% discount
      mockPrismaClient.studentParent.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/admin/students');
      const response = await GET(request);
      const data = await response.json();

      // 150.00 base amount with 0% discount = 150.00
      expect(data.students[0].effectiveMonthlyAmount).toBe(150.00);
    });
  });
});
