process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

// Mock Prisma client so tests run without a database
jest.mock('../utils/prisma', () => {
  return {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    eodTemplate: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    notification: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
});
