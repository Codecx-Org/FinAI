import express from 'express';
import { OrderService } from '../services/orders-services';

const router = express.Router();
const orderService = new OrderService();

router.post('/orders', async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await orderService.getOrder(Number(req.params.id));
    if (!order) throw new Error('Order not found');
    res.json(order);
  } catch (error) {
    res.status(404).json({ error: 'Order not found' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.put('/orders/:id', async (req, res) => {
  try {
    const order = await orderService.updateOrder(Number(req.params.id), req.body);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

router.delete('/orders/:id', async (req, res) => {
  try {
    await orderService.deleteOrder(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;