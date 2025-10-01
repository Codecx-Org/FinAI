import { RedisService } from "../services/redis-service";
const redisService = new RedisService()
export function startOrderCompletedSubscriber() {
  redisService.subscribe('order:completed', async (message: string) => {
    try {
      const { orderId } = JSON.parse(message);
      await orderCompletionWorkflow().run({ input: { orderId } });
      console.log(`Workflow triggered for order ${orderId}`);
    } catch (error) {
      console.error('Failed to process order completed event:', error);
    }
  });
}