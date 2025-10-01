// PaymentService for MPESA integration using mpesa-node library.
// Note: Obtain MPESA credentials (Consumer Key, Secret, Passkey, Shortcode) from Safaricom Daraja portal.
// Set up environment variables for security (e.g., via dotenv).
// For production, ensure webhook endpoint is public (use ngrok for local testing).
// This service initiates STK Push and handles webhooks to update order status.
import Mpesa from 'mpesa-node';
import { redisService } from './redis-service'; // From previous RedisService
import prisma from '../utils/prisma';


// MPESA Configuration (use env vars in production)
const MPESA_CONFIG = {
  consumerKey: 'YOUR_CONSUMER_KEY',
  consumerSecret: 'YOUR_CONSUMER_SECRET',
  passkey: 'YOUR_PASSKEY',
  shortCode: 'YOUR_BUSINESS_SHORTCODE', // e.g., 174379
  callbackUrl: 'https://your-domain.com/api/webhook/mpesa', // Public webhook URL
};

const mpesa = new Mpesa(MPESA_CONFIG);

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
        throw new Error('Order not found');
      }
      if (order.status !== 'created') {
        throw new Error('Order not in payable state');
      }

      // Generate timestamp and password
      const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
      const password = Buffer.from(`${MPESA_CONFIG.shortCode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64');

      // STK Push request
      const response = await mpesa.stkPush({
        BusinessShortCode: MPESA_CONFIG.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone.replace(/^0/, '254'), // Format to 2547xxxxxxxx
        PartyB: MPESA_CONFIG.shortCode,
        PhoneNumber: phone.replace(/^0/, '254'),
        CallBackURL: MPESA_CONFIG.callbackUrl,
        AccountReference: `Order_${orderId}`,
        TransactionDesc: 'Payment for order',
      });

      // Update order status to pending
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'pending' },
      });

      // Publish event for pending payment
      await redisService.publish('payment:initiated', JSON.stringify({ orderId, phone, amount }));

      return { success: true, message: 'STK Push initiated', data: response };
    } catch (error) {
      console.error('STK Push failed:', error);
      return { success: false, message: 'STK Push failed', data: error };
    }
  }

  // Handle MPESA Webhook: Update order on payment confirmation
  async handleMpesaWebhook(payload: any): Promise<{ success: boolean; message: string }> {
    try {
      // Validate payload (simplified; add signature verification in production)
      if (!payload || !payload.Body || !payload.Body.stkCallback) {
        throw new Error('Invalid webhook payload');
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
        throw new Error('Order ID not found in payload');
      }

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        throw new Error('Order not found');
      }

      if (ResultCode === 0) {
        // Success: Update order status to 'paid'
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'paid' }, // Or 'completed' if payment completes the order
        });

        // Publish completion event to trigger workflow
        await redisService.publish('payment:completed', JSON.stringify({ orderId }));

        return { success: true, message: 'Payment processed successfully' };
      } else {
        // Failure: Update to 'payment_failed'
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'payment_failed' },
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