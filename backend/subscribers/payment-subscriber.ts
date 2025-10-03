import { redisService } from '../services/redis-service.js';
import { runOrderCompletionWorkflow } from '../workflows/order-completion-workflow.js';
import { PaymentService } from '../services/payment-service.js';

const paymentService = new PaymentService();

export function startPaymentSubscriber() {
  // Subscribe to payment:completed event
  redisService.subscribe('payment:completed', async (message: string) => {
    try {
      const { orderId } = JSON.parse(message);
      console.log(`Received payment:completed for order ${orderId}`);

      // Trigger the BullMQ workflow
      await runOrderCompletionWorkflow(orderId);
      console.log(`Workflow triggered for order ${orderId}`);
    } catch (error: any) {
      console.error(`Failed to process payment:completed for order:`, error);
    }
  });

  // Subscribe to payment:failed (optional, for logging or recovery)
  redisService.subscribe('payment:failed', async (message: string) => {
    try {
      const { orderId, reason } = JSON.parse(message);
      console.log(`Payment failed for order ${orderId}: ${reason}`);
      // Optional: Notify admin, update order status, etc.
    } catch (error: any) {
      console.error('Failed to process payment:failed:', error);
    }
  });

  // Subscribe to payment:initiated (optional, for logging)
  redisService.subscribe('payment:initiated', async (message: string) => {
    try {
      const { orderId, phone, amount } = JSON.parse(message);
      console.log(`Payment initiated for order ${orderId}: ${amount} to ${phone}`);
    } catch (error: any) {
      console.error('Failed to process payment:initiated:', error);
    }
  });
}