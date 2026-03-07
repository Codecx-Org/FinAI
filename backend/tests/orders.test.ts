import { jest } from '@jest/globals';
import request from 'supertest';

// 1. Mock BullMQ
jest.unstable_mockModule('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({ add: jest.fn(), close: jest.fn() })),
  Worker: jest.fn().mockImplementation(() => ({ on: jest.fn(), close: jest.fn() })),
  FlowProducer: jest.fn().mockImplementation(() => ({ add: jest.fn() })),
  Job: class {},
}));

// 2. Mock Redis
jest.unstable_mockModule('ioredis', () => {
    const Redis = jest.fn().mockImplementation(() => ({
        on: jest.fn(), quit: jest.fn(), publish: jest.fn(), subscribe: jest.fn(), disconnect: jest.fn(),
    }));
    return { default: Redis, Redis: Redis };
});

// 3. Mock Prisma
jest.unstable_mockModule('../utils/prisma.js', () => ({
  default: {
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    orderItem: {
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

const { default: prismaMock } = (await import('../utils/prisma.js')) as any;
const { default: app } = await import('../main.js');

describe('Order Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const orderData = { customerId: 1, totalAmount: 500, status: 'created', orderItems: [] };
      prismaMock.order.create.mockResolvedValue({ id: 1, ...orderData });

      const response = await request(app).post('/api/orders').send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(1);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return 404 if order not found', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);
      const response = await request(app).get('/api/orders/99');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Order not found');
    });
  });
});
