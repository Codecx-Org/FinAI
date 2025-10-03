// src/api/routes/payment.ts
// Payment routes for initiating MPESA STK Push payments.
// Integrates with PaymentService for MPESA operations.
// Features: Winston logging, user-friendly errors, async handling.

import express from 'express';
import { PaymentService } from '../services/payment-service.js';
import winston from 'winston';

const router = express.Router();
const paymentService = new PaymentService();

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Initiate MPESA STK Push payment
router.post('/payments/initiate', async (req: express.Request, res: express.Response) => {
  try {
    const { orderId, phone, amount } = req.body;

    // Validate input
    if (!orderId || !phone || !amount) {
      logger.warn('Missing required fields for payment initiation', { body: req.body });
      return res.status(400).json({ error: 'Order ID, phone number, and amount are required.' });
    }

    if (isNaN(orderId) || isNaN(amount) || amount <= 0) {
      logger.warn('Invalid input for payment initiation', { orderId, amount });
      return res.status(400).json({ error: 'Order ID and amount must be valid numbers, and amount must be positive.' });
    }

    logger.info(`Initiating payment for order ${orderId}, phone ${phone}, amount ${amount}`);

    // Call PaymentService to initiate STK Push
    const result = await paymentService.initiateSTKPush(Number(orderId), phone, Number(amount));

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        checkoutRequestID: result.data.checkoutRequestID,
      });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error: any) {
    logger.error(`Payment initiation failed: ${error.message}`, { stack: error.stack, body: req.body });
    res.status(500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Failed to initiate payment. Please try again later.'
        : error.message || 'Internal server error',
    });
  }
});

// Get payment status (optional, for checking order payment status)
router.get('/payments/:orderId/status', async (req: express.Request, res: express.Response) => {
  try {
    const orderId = Number(req.params.orderId);
    if (isNaN(orderId)) {
      logger.warn('Invalid order ID for payment status', { orderId: req.params.orderId });
      return res.status(400).json({ error: 'Invalid order ID.' });
    }

    logger.info(`Fetching payment status for order ${orderId}`);

    // Fetch order status (since PaymentService updates order status)
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      logger.warn(`Order ${orderId} not found for payment status`);
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json({
      orderId,
      status: order.status, // e.g., 'created', 'payment_pending', 'paid', 'payment_failed'
    });
  } catch (error: any) {
    logger.error(`Payment status check failed for order ${req.params.orderId}: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Failed to check payment status. Please try again later.'
        : error.message || 'Internal server error',
    });
  }
});

export default router;
