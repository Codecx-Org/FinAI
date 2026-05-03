import express from 'express';
import { OrderService } from '../services/orders-services.js';
import { asyncHandler } from '../utils/async-handler.js';
import { authenticate } from '../utils/auth-middleware.js';
import type { AuthenticatedRequest } from '../utils/auth-middleware.js';

const router = express.Router();
const orderService = new OrderService();

router.post('/orders', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  const order = await orderService.createOrder({ ...req.body, businessId });
  res.status(201).json(order);
}));

router.get('/orders/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  const order = await orderService.getOrder(Number(req.params.id), businessId);
  res.json(order);
}));

router.get('/orders', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = Number(req.query.businessId) || req.user?.id;
  const orders = await orderService.getAllOrders(businessId);
  res.json(orders);
}));

router.put('/orders/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  const order = await orderService.updateOrder(Number(req.params.id), businessId, req.body);
  res.json(order);
}));

router.delete('/orders/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  await orderService.deleteOrder(Number(req.params.id), businessId);
  res.status(204).send();
}));

export default router;
