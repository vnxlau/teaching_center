import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: '',
      asPath: '/',
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN'
      },
      expires: '2025-01-01T00:00:00.000Z'
    },
    status: 'authenticated'
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  getSession: jest.fn(() => Promise.resolve({
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin'
    },
    expires: '2025-01-01T00:00:00.000Z'
  }))
}));

// Mock NextAuth providers
jest.mock('next-auth/providers/credentials', () => ({
  default: jest.fn((options) => ({
    id: 'credentials',
    name: 'credentials',
    type: 'credentials',
    authorize: jest.fn(),
    ...options
  }))
}));

// Mock custom hooks
jest.mock('@/components/NotificationProvider', () => ({
  useNotification: () => ({
    showNotification: jest.fn(),
    hideNotification: jest.fn()
  })
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    expense: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    student: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    }
  }
}));

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Global test setup
beforeAll(() => {
  // Setup global test environment
});

afterAll(() => {
  // Cleanup after all tests
});
