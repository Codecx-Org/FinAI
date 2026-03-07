import express from 'express';
import { OrderService } from '../services/orders-services.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = express.Router();
const orderService = new OrderService();

router.post('/orders', asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body);
  res.status(201).json(order);
}));

router.get('/orders/:id', asyncHandler(async (req, res) => {
  const order = await orderService.getOrder(Number(req.params.id));
  res.json(order);
}));

router.get('/orders', asyncHandler(async (req, res) => {
  const orders = await orderService.getAllOrders();
  res.json(orders);
}));

router.put('/orders/:id', asyncHandler(async (req, res) => {
  const order = await orderService.updateOrder(Number(req.params.id), req.body);
  res.json(order);
}));

router.delete('/orders/:id', asyncHandler(async (req, res) => {
  await orderService.deleteOrder(Number(req.params.id));
  res.status(204).send();
}));

export default router;
