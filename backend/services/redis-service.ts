import {Redis} from 'ioredis';

// Configuration interface for Redis connection
interface RedisConfig {
  url: string; // e.g., 'redis://localhost:6379' or cloud provider URL
  retryAttempts?: number;
  retryDelay?: number;
}

//NB: You should have the redis server up and runnig locally
//if it is running at a different port then adjust the url
//Responsible for establishing a singleton instance of the service
//Denys multiple connection to the redis server
export class RedisService {
  private client: Redis;
  private subscribers: Map<string, Redis>; // Track subscribers for cleanup

  constructor(config: RedisConfig = { url: 'redis://localhost:6379', retryAttempts: 3, retryDelay: 1000 }) {
    // Initialize main client for publishing
    this.client = new Redis(config.url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * config.retryDelay!, 30000),
    });

    this.subscribers = new Map();

    // Handle errors
    this.client.on('error', (err: Error) => {
      console.error('Redis Client Error:', err);
    });

    // Log connection
    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });
  }

  // Publish a message to a channel
  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.client.publish(channel, message);
      console.log(`Published to ${channel}: ${message}`);
    } catch (error) {
      console.error(`Failed to publish to ${channel}:`, error);
      throw new Error(`Publish failed: ${error}`);
    }
  }

  // Subscribe to a channel with a handler
  async subscribe(channel: string, handler: (message: string, channel: string) => void): Promise<void> {
    try {
      // Create a dedicated subscriber client
      const subscriber = this.client.duplicate();
      this.subscribers.set(channel, subscriber);

      await subscriber.subscribe(channel);
      subscriber.on('message', (ch, msg) => {
        console.log(`Received on ${ch}: ${msg}`);
        handler(msg, ch);
      });

      subscriber.on('error', (err: Error) => {
        console.error(`Redis Subscriber Error for ${channel}:`, err);
      });
    } catch (error) {
      console.error(`Failed to subscribe to ${channel}:`, error);
      throw new Error(`Subscribe failed: ${error}`);
    }
  }

  // Unsubscribe from a channel
  async unsubscribe(channel: string): Promise<void> {
    const subscriber = this.subscribers.get(channel);
    if (subscriber) {
      await subscriber.unsubscribe(channel);
      await subscriber.quit();
      this.subscribers.delete(channel);
      console.log(`Unsubscribed from ${channel}`);
    }
  }

  // Cleanup: Disconnect all clients
  async quit(): Promise<void> {
    for (const subscriber of this.subscribers.values()) {
      await subscriber.quit();
    }
    this.subscribers.clear();
    await this.client.quit();
    console.log('Redis Client Disconnected');
  }
}

// Singleton instance (export for use across app)
export const redisService = new RedisService();
