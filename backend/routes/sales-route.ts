import express from 'express';
import { SalesService } from '../services/sales-service';

const router = express.Router();
const salesService = new SalesService();

router.post('/sales', async (req, res) => {
  try {
    const sale = await salesService.createSale(req.body);
    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create sale' });
  }
});

router.get('/sales/:id', async (req, res) => {
  try {
    const sale = await salesService.getSale(Number(req.params.id));
    if (!sale) throw new Error('Sale not found');
    res.json(sale);
  } catch (error) {
    res.status(404).json({ error: 'Sale not found' });
  }
});

router.get('/sales', async (req, res) => {
  try {
    const sales = await salesService.getAllSales();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

router.put('/sales/:id', async (req, res) => {
  try {
    const sale = await salesService.updateSale(Number(req.params.id), req.body);
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sale' });
  }
});

router.delete('/sales/:id', async (req, res) => {
  try {
    await salesService.deleteSale(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sale' });
  }
});

export default router;