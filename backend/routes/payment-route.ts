// Payment routes for initiating MPESA STK Push payments and checking order payment status.

import express from 'express';
import { PaymentService } from '../services/payment-service.js';
import prisma from '../utils/prisma.js';
import { asyncHandler } from '../utils/async-handler.js';
import { BadRequestError, NotFoundError } from '../utils/types/errors.js';

const router = express.Router();
const paymentService = new PaymentService();

router.post(
  '/payments/initiate',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { orderId, phone, amount } = req.body;

    if (!orderId || !phone || !amount) {
      throw new BadRequestError('Order ID, phone number, and amount are required.');
    }

    if (isNaN(orderId) || isNaN(amount) || amount <= 0) {
      throw new BadRequestError(
        'Order ID and amount must be valid numbers, and amount must be positive.',
      );
    }

    const result = await paymentService.initiateSTKPush(
      Number(orderId),
      phone,
      Number(amount),
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        checkoutRequestID: result.data.checkoutRequestID,
      });
      return;
    }

    throw new BadRequestError(result.message);
  }),
);

router.get(
  '/payments/:orderId/status',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const orderId = Number(req.params.orderId);
    if (isNaN(orderId)) {
      throw new BadRequestError('Invalid order ID.');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new NotFoundError('Order not found.');
    }

    res.json({
      orderId,
      status: order.status,
    });
  }),
);

export default router;
