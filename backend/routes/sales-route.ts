import express from 'express';
import { SalesService } from '../services/sales-service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { authenticate } from '../utils/auth-middleware.js';
import type { AuthenticatedRequest } from '../utils/auth-middleware.js';

const router = express.Router();
const salesService = new SalesService();

router.post('/sales', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  const sale = await salesService.createSale({ ...req.body, businessId });
  res.status(201).json(sale);
}));

router.get('/sales/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  const sale = await salesService.getSale(Number(req.params.id), businessId);
  res.json(sale);
}));

router.get('/sales', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = Number(req.query.businessId) || req.user?.id;
  const sales = await salesService.getAllSales(businessId);
  res.json(sales);
}));

router.put('/sales/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  const sale = await salesService.updateSale(Number(req.params.id), businessId, req.body);
  res.json(sale);
}));

router.delete('/sales/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  await salesService.deleteSale(Number(req.params.id), businessId);
  res.status(204).send();
}));

export default router;
