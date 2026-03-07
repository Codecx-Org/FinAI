import express from 'express';
import { OrderItemService } from '../services/orders-items-services.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = express.Router();
const orderItemService = new OrderItemService();

router.post('/order-items', asyncHandler(async (req, res) => {
  const orderItem = await orderItemService.createOrderItem(req.body);
  res.status(201).json(orderItem);
}));

router.get('/order-items/:id', asyncHandler(async (req, res) => {
  const orderItem = await orderItemService.getOrderItem(Number(req.params.id));
  res.json(orderItem);
}));

router.get('/order-items', asyncHandler(async (req, res) => {
  const orderItems = await orderItemService.getAllOrderItems();
  res.json(orderItems);
}));

router.put('/order-items/:id', asyncHandler(async (req, res) => {
  const orderItem = await orderItemService.updateOrderItem(Number(req.params.id), req.body);
  res.json(orderItem);
}));

router.delete('/order-items/:id', asyncHandler(async (req, res) => {
  await orderItemService.deleteOrderItem(Number(req.params.id));
  res.status(204).send();
}));

export default router;
