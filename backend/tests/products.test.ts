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
    product: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

const { default: prismaMock } = (await import('../utils/prisma.js')) as any;
const { default: app } = await import('../main.js');

describe('Product Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const productData = { name: 'Widget', stockQuantity: 10, price: 100, buyingPrice: 50 };
      prismaMock.product.create.mockResolvedValue({ id: 1, ...productData });

      const response = await request(app).post('/api/products').send(productData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Widget');
    });

    it('should return 400 for negative price', async () => {
      const productData = { name: 'Widget', stockQuantity: 10, price: -10, buyingPrice: 50 };
      const response = await request(app).post('/api/products').send(productData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Price and buying price must be non-negative');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return 404 if product not found', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);
      const response = await request(app).get('/api/products/99');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found');
    });
  });
});
