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


const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY!,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
  shortCode: process.env.MPESA_SHORTCODE,
  // Callback URL must be a public HTTPS URL. Set MPESA_CALLBACK_URL in .env
  // For local dev, use: ngrok http 3000 → set ngrok URL here
  callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/webhook/mpesa',
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
      // Fetch order to validate and include business
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { 
          customer: true,
          business: true 
        },
      });
      if (!order) {
        throw new NotFoundError("order not found")
      }
      if (order.status !== OrderStatus.created) {
        throw new BadRequestError("order status is not created");
      }

      const mpesaShortCode = order.business?.mpesaShortcode || MPESA_CONFIG.shortCode;
      
      if (!mpesaShortCode) {
        throw new BadRequestError("Business mpesa shortcode not configured");
      }

      // Generate timestamp and password
      const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);

      // Ensure phone number is in 254 format (remove +, replace leading 0)
      let formattedPhoneNo = phone.replace(/\s+/g, '');
      if (formattedPhoneNo.startsWith('+')) {
        formattedPhoneNo = formattedPhoneNo.substring(1);
      }
      if (formattedPhoneNo.startsWith('0')) {
        formattedPhoneNo = '254' + formattedPhoneNo.substring(1);
      }
      
      const accountRef = `Order_${orderId}`;
      
      // Update config for this request if necessary, or pass it to the library
      // Assuming mpesa-node might need a new instance or a way to override.
      // If the library doesn't support overriding, we might need to recreate the instance.
      const currentMpesa = new Mpesa({
        ...MPESA_CONFIG,
        shortCode: mpesaShortCode
      });

      // STK Push request
      // Note: TransactionType depends on shortcode type (Paybill vs BuyGoods).
      // Defaulting to CustomerPayBillOnline for Paybill. For BuyGoods use CustomerBuyGoodsOnline.
      const transactionType = "CustomerPayBillOnline"; 
      
      const response = await currentMpesa.lipaNaMpesaOnline(
        formattedPhoneNo,
        amount,
        MPESA_CONFIG.callbackUrl,
        accountRef,
        `Payment for order ${orderId}`,
        transactionType
      );

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
