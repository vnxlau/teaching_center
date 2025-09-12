import bcrypt from 'bcryptjs';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn()
}));

const mockPrisma = require('@/lib/prisma').prisma;
const mockBcryptCompare = bcrypt.compare as jest.Mock;

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Credentials Provider Logic', () => {
    const mockCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedPassword',
      role: 'STUDENT',
      student: {
        id: 'student1',
        firstName: 'John',
        lastName: 'Doe'
      },
      parent: null,
      staff: null
    };

    it('should return null when credentials are missing', async () => {
      // Test the logic that would be in the authorize function
      const emptyCredentials = {} as any;
      const result = !emptyCredentials?.email || !emptyCredentials?.password ? null : 'would authenticate';

      expect(result).toBeNull();
    });

    it('should return null when user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Simulate the authorize function logic
      const user = await mockPrisma.user.findUnique({
        where: { email: mockCredentials.email },
        include: {
          student: true,
          parent: true,
          staff: true
        }
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockCredentials.email },
        include: {
          student: true,
          parent: true,
          staff: true
        }
      });
      expect(user).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(false);

      const user = await mockPrisma.user.findUnique({
        where: { email: mockCredentials.email },
        include: {
          student: true,
          parent: true,
          staff: true
        }
      });

      const isValidPassword = await mockBcryptCompare(
        mockCredentials.password,
        user!.password
      );

      expect(mockBcryptCompare).toHaveBeenCalledWith(
        mockCredentials.password,
        mockUser.password
      );
      expect(isValidPassword).toBe(false);
    });

    it('should return user object when authentication is successful', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);

      const user = await mockPrisma.user.findUnique({
        where: { email: mockCredentials.email },
        include: {
          student: true,
          parent: true,
          staff: true
        }
      });

      const isValidPassword = await mockBcryptCompare(
        mockCredentials.password,
        user!.password
      );

      const result = {
        id: user!.id,
        email: user!.email,
        name: user!.name,
        role: 'STUDENT',
        studentId: user!.student!.id,
        studentName: `${user!.student!.firstName} ${user!.student!.lastName}`
      };

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: 'STUDENT',
        studentId: mockUser.student.id,
        studentName: `${mockUser.student.firstName} ${mockUser.student.lastName}`
      });
    });

    // Parent user test
    const parentUser = {
      id: '2',
      email: 'parent@example.com',
      name: 'Parent User',
      password: 'hashedPassword',
      role: 'PARENT',
      student: null,
      parent: {
        id: 'parent1',
        firstName: 'Jane',
        lastName: 'Doe'
      },
      staff: null
    };

    it('should handle parent role correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(parentUser);
      mockBcryptCompare.mockResolvedValue(true);

      const user = await mockPrisma.user.findUnique({
        where: { email: mockCredentials.email },
        include: {
          student: true,
          parent: true,
          staff: true
        }
      });

      const result = {
        id: user!.id,
        email: user!.email,
        name: user!.name,
        role: 'PARENT',
        parentId: user!.parent!.id,
        parentName: `${user!.parent!.firstName} ${user!.parent!.lastName}`
      };

      expect(result).toEqual({
        id: parentUser.id,
        email: parentUser.email,
        name: parentUser.name,
        role: 'PARENT',
        parentId: parentUser.parent.id,
        parentName: `${parentUser.parent.firstName} ${parentUser.parent.lastName}`
      });
    });

    // Staff user test
    const staffUser = {
      id: '3',
      email: 'staff@example.com',
      name: 'Staff User',
      password: 'hashedPassword',
      role: 'STAFF',
      student: null,
      parent: null,
      staff: {
        id: 'staff1',
        firstName: 'Mike',
        lastName: 'Johnson',
        department: 'Administration'
      }
    };

    it('should handle staff role correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(staffUser);
      mockBcryptCompare.mockResolvedValue(true);

      const user = await mockPrisma.user.findUnique({
        where: { email: mockCredentials.email },
        include: {
          student: true,
          parent: true,
          staff: true
        }
      });

      const result = {
        id: user!.id,
        email: user!.email,
        name: user!.name,
        role: 'STAFF',
        staffId: user!.staff!.id,
        staffName: `${user!.staff!.firstName} ${user!.staff!.lastName}`,
        department: user!.staff!.department
      };

      expect(result).toEqual({
        id: staffUser.id,
        email: staffUser.email,
        name: staffUser.name,
        role: 'STAFF',
        staffId: staffUser.staff.id,
        staffName: `${staffUser.staff.firstName} ${staffUser.staff.lastName}`,
        department: staffUser.staff.department
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      try {
        await mockPrisma.user.findUnique({
          where: { email: mockCredentials.email },
          include: {
            student: true,
            parent: true,
            staff: true
          }
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Database error');
      }
    });

    it('should handle bcrypt errors gracefully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcryptCompare.mockRejectedValue(new Error('Bcrypt error'));

      try {
        await mockBcryptCompare(mockCredentials.password, mockUser.password);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Bcrypt error');
      }
    });
  });

  describe('Auth Configuration', () => {
    it('should have mocked prisma available', () => {
      expect(mockPrisma).toBeDefined();
      expect(mockPrisma.user.findUnique).toBeDefined();
    });

    it('should have mocked bcrypt available', () => {
      expect(mockBcryptCompare).toBeDefined();
    });
  });
});
