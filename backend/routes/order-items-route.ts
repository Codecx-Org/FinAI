import express from 'express';
import { OrderItemService } from '../services/orders-items-services.js';

const router = express.Router();
const orderItemService = new OrderItemService();

router.post('/order-items', async (req, res) => {
  try {
    const orderItem = await orderItemService.createOrderItem(req.body);
    res.status(201).json(orderItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order item' });
  }
});

router.get('/order-items/:id', async (req, res) => {
  try {
    const orderItem = await orderItemService.getOrderItem(Number(req.params.id));
    if (!orderItem) throw new Error('Order item not found');
    res.json(orderItem);
  } catch (error) {
    res.status(404).json({ error: 'Order item not found' });
  }
});

router.get('/order-items', async (req, res) => {
  try {
    const orderItems = await orderItemService.getAllOrderItems();
    res.json(orderItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order items' });
  }
});

router.put('/order-items/:id', async (req, res) => {
  try {
    const orderItem = await orderItemService.updateOrderItem(Number(req.params.id), req.body);
    res.json(orderItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order item' });
  }
});

router.delete('/order-items/:id', async (req, res) => {
  try {
    await orderItemService.deleteOrderItem(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order item' });
  }
});

export default router;