// src/api/routes/webhook.ts
import express from 'express';
import { PaymentService } from '../services/payment-service.js';

const router = express.Router();
const paymentService = new PaymentService();

//@todo: In the future we should implement a type safe body....important
router.post('/webhook/mpesa', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const result = await paymentService.handleMpesaWebhook(req.body);
    res.status(result.success ? 200 : 400).json({
      ResultCode: result.success ? 0 : 1,
      ResultDesc: result.message,
    });
  } catch (error: any) {
    res.status(500).json({ ResultCode: 1, ResultDesc: error.message || 'Webhook processing failed' });
  }
});

export default router;