import { getSystemSettings } from '@/lib/systemSettings';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    systemSettings: {
      findMany: jest.fn(),
    }
  }
}));

const mockPrisma = require('@/lib/prisma').prisma;

describe('System Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return default settings when database is empty', async () => {
    mockPrisma.systemSettings.findMany.mockResolvedValue([]);

    const settings = await getSystemSettings();

    expect(settings).toEqual({
      school_name: 'Teaching Center Excellence',
      school_address: '123 Education Street, Learning City, LC 12345',
      school_phone: '+351 123 456 789',
      school_email: 'info@teachingcenter.com',
      academic_year: '2024-2025',
      currency: 'EUR',
      timezone: 'Europe/Lisbon'
    });
  });
});
