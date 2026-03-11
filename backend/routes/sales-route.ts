import express from 'express';
import { SalesService } from '../services/sales-service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = express.Router();
const salesService = new SalesService();

router.post('/sales', asyncHandler(async (req, res) => {
  const sale = await salesService.createSale(req.body);
  res.status(201).json(sale);
}));

router.get('/sales/:id', asyncHandler(async (req, res) => {
  const sale = await salesService.getSale(Number(req.params.id));
  res.json(sale);
}));

router.get('/sales', asyncHandler(async (req, res) => {
  const businessId = req.query.businessId ? Number(req.query.businessId) : undefined;
  const sales = await salesService.getAllSales(businessId);
  res.json(sales);
}));

router.put('/sales/:id', asyncHandler(async (req, res) => {
  const sale = await salesService.updateSale(Number(req.params.id), req.body);
  res.json(sale);
}));

router.delete('/sales/:id', asyncHandler(async (req, res) => {
  await salesService.deleteSale(Number(req.params.id));
  res.status(204).send();
}));

export default router;
