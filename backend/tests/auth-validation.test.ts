import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://localhost:5432/test';
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

jest.unstable_mockModule('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({ add: jest.fn(), close: jest.fn() })),
  Worker: jest.fn().mockImplementation(() => ({ on: jest.fn(), close: jest.fn() })),
  FlowProducer: jest.fn().mockImplementation(() => ({ add: jest.fn() })),
  Job: class {},
}));

jest.unstable_mockModule('ioredis', () => {
  const Redis = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    disconnect: jest.fn(),
  }));
  return { default: Redis, Redis };
});

jest.unstable_mockModule('../utils/prisma.js', () => ({
  default: {
    business: {
      findUnique: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

jest.unstable_mockModule('../services/payment-service.js', () => ({
  PaymentService: jest.fn().mockImplementation(() => ({
    handleMpesaWebhook: jest.fn().mockResolvedValue({
      success: false,
      message: 'Invalid payload',
    }),
  })),
}));

const { default: prismaMock } = (await import('../utils/prisma.js')) as {
  default: { business: { findUnique: jest.Mock }; order: { findUnique: jest.Mock } };
};
const { default: app } = await import('../main.js');

describe('Auth validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('returns 400 for empty body', async () => {
      const response = await request(app).post('/api/auth/login').send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBeTruthy();
    });

    it('returns 401 for invalid credentials', async () => {
      prismaMock.business.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrongpassword1' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });
  });

  describe('POST /api/auth/register', () => {
    it('returns 400 when ownerEmail is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Biz',
          ownerName: 'Owner',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message.toLowerCase()).toContain('owneremail');
    });
  });
});

describe('GET /api/public/health', () => {
  it('returns 200 without authorization', async () => {
    const response = await request(app).get('/api/public/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });
});

describe('M-Pesa webhook route', () => {
  it('POST /api/webhook/mpesa is mounted and returns Safaricom-style body', async () => {
    const response = await request(app)
      .post('/api/webhook/mpesa')
      .set('Content-Type', 'application/json')
      .send(Buffer.from('{}'));

    expect([200, 400]).toContain(response.status);
    expect(response.body).toHaveProperty('ResultCode');
    expect(response.body).toHaveProperty('ResultDesc');
  });
});
