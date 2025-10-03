// PaymentService for MPESA integration using mpesa-node library.
// Note: Obtain MPESA credentials (Consumer Key, Secret, Passkey, Shortcode) from Safaricom Daraja portal.
// Set up environment variables for security (e.g., via dotenv).
// For production, ensure webhook endpoint is public (use ngrok for local testing).
// This service initiates STK Push and handles webhooks to update order status.
import Mpesa from 'mpesa-node';
import { redisService } from './redis-service.js'; // From previous RedisService
import prisma from '../utils/prisma.js';
import { BadRequestError, InternalServerError, NotFoundError } from '../utils/types/errors.js';
import { OrderStatus } from '../generated/prisma/client.js';


// MPESA Configuration (use env vars in production)
const MPESA_CONFIG = {
  consumerKey: 'YOUR_CONSUMER_KEY',
  consumerSecret: 'YOUR_CONSUMER_SECRET',
  passkey: 'YOUR_PASSKEY',
  shortCode: 'YOUR_BUSINESS_SHORTCODE', // e.g., 174379
  callbackUrl: 'https://your-domain.com/api/webhook/mpesa', // Public webhook URL
};

const mpesa = new Mpesa(MPESA_CONFIG);

//configures the error
export class ErrOrderNotFound extends Error {
  constructor(){
    super()
    super.name = "ErrOrderNotFound"
    super.message = "Order not found"
  }
}



export class PaymentService {
  // Initiate STK Push: Trigger payment prompt on customer's phone
  async initiateSTKPush(orderId: number, phone: string, amount: number): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Fetch order to validate
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true },
      });
      if (!order) {
        throw new NotFoundError("order not found")
      }
      if (order.status !== OrderStatus.created) {
        throw new BadRequestError("order status is not created");
      }

      // Generate timestamp and password
      const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
      const password = Buffer.from(`${MPESA_CONFIG.shortCode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64');


      const formattedPhoneNo = phone.replace(/^0/, '254')
      const accountRef = `Order_${orderId}_${Math.random().toString(36).substring(2,7)}`
      // STK Push request
      const response = await mpesa.lipaNaMpesaOnline(formattedPhoneNo,amount,MPESA_CONFIG.callbackUrl,accountRef,`Payment for order ${orderId}`, "CustomerPayBillOnline");

      // Update order status to pending
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.pending},
      });

      // Publish event for pending payment
      await redisService.publish('payment:initiated', JSON.stringify({ orderId, phone, amount }));

      return { success: true, message: 'STK Push initiated', data: response };
    } catch (error) {
      console.error('STK Push failed:', error);
      if (error instanceof BadRequestError){
        return {success: false, message: 'STK Push failed', data: error}
      }

      if (error instanceof InternalServerError){
        return {success: false, message: 'STK Push failed', data: error}
      }

      return { success: false, message: 'STK Push failed', data: error}
    }
  }

  // Handle MPESA Webhook: Update order on payment confirmation
  // in the future update the payload to support known types
  async handleMpesaWebhook(payload: any): Promise<{ success: boolean; message: string }> {
    try {
      // Validate payload (simplified; add signature verification in production)
      if (!payload || !payload.Body || !payload.Body.stkCallback) {
        throw new BadRequestError("payload empty")
      }

      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = payload.Body.stkCallback;
      const metadata = payload.Body.stkCallback.CallbackMetadata?.Item || [];

      // Extract details (e.g., amount, receipt, phone)
      const amount = metadata.find((item: any) => item.Name === 'Amount')?.Value;
      const receipt = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const phone = metadata.find((item: any) => item.Name === 'PhoneNumber')?.Value;

      // Find order by AccountReference (from STK Push)
      const accountRef = metadata.find((item: any) => item.Name === 'AccountReference')?.Value;
      const orderId = parseInt(accountRef?.split('_')[1] || '0', 10);
      if (!orderId) {
        throw new BadRequestError("order id not defined");
      }

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        throw new NotFoundError("order not found")
      }

      if (ResultCode === 0) {
        // Success: Update order status to 'paid'
        await prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.paid}, // Or 'completed' if payment completes the order
        });

        // Publish completion event to trigger workflow
        await redisService.publish('payment:completed', JSON.stringify({ orderId, amount, receipt, phone }));

        return { success: true, message: 'Payment processed successfully' };
      } else {
        // Failure: Update to 'payment_failed'
        await prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.failed },
        });

        await redisService.publish('payment:failed', JSON.stringify({ orderId, reason: ResultDesc }));

        return { success: false, message: `Payment failed: ${ResultDesc}` };
      }
    } catch (error) {
      console.error('Webhook handling failed:', error);
      return { success: false, message: 'Webhook processing failed' };
    }
  }
}


// Integration:
// - In OrderService or route: Call paymentService.initiateSTKPush(orderId, customer.phone, order.totalAmount)
// - Register webhook route in Express app: app.use('/api', webhookRoutes);
// - For production, verify MPESA IP whitelist and use HTTPS.
// - Test with Daraja sandbox: https://developer.safaricom.co.ke/
