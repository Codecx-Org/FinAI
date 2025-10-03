import { RedisService } from "../services/redis-service.js";
import { runOrderCompletionWorkflow } from "../workflows/order-completion-workflow.js";
const redisService = new RedisService()

//the function is responsible for triggering the order completion workflow
export function startOrderCompletedSubscriber() {
  redisService.subscribe('order:completed', async (message: string) => {
    try {
      const { orderId } = JSON.parse(message);
      await runOrderCompletionWorkflow(orderId);
      console.log(`Workflow triggered for order ${orderId}`);
    } catch (error) {
      console.error('Failed to process order completed event:', error);
    }
  });
}
