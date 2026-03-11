import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

// MOCKING MUST COME FIRST in ESM with jest.unstable_mockModule

// 1. Mock BullMQ
jest.unstable_mockModule('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    close: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
  FlowProducer: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
  })),
}));

// 2. Mock Redis
jest.unstable_mockModule('ioredis', () => {
    const Redis = jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        quit: jest.fn(),
        publish: jest.fn(),
        subscribe: jest.fn(),
        disconnect: jest.fn(),
    }));
    return {
        default: Redis,
        Redis: Redis
    };
});

// 3. Mock Prisma
jest.unstable_mockModule('../utils/prisma.js', () => ({
  default: {
    customer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

// 4. Import the modules that depend on the mocks
const { default: prismaMock } = (await import('../utils/prisma.js')) as any;
const { default: app } = await import('../main.js');

describe('Customer Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/customers', () => {
    it('should create a new customer', async () => {
      const customerData = { name: 'John Doe', email: 'john@example.com', phone: '123456789' };
      const expectedCustomer = { id: 1, ...customerData, createAt: new Date() };
      
      prismaMock.customer.create.mockResolvedValue(expectedCustomer);

      const response = await request(app)
        .post('/api/customers')
        .send(customerData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(customerData.name);
      expect(prismaMock.customer.create).toHaveBeenCalled();
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should return a customer if found', async () => {
      const customer = { id: 1, name: 'John Doe', orders: [] };
      prismaMock.customer.findUnique.mockResolvedValue(customer);

      const response = await request(app).get('/api/customers/1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
    });

    it('should return 404 if customer not found', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/customers/999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Customer not found');
    });
  });
});
