import { jest } from '@jest/globals';

// Mock BullMQ to prevent connection errors
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

// Mock Redis (ioredis)
jest.unstable_mockModule('ioredis', () => ({
  default: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
  })),
  Redis: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
  })),
}));
