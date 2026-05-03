import express from 'express';
import { CustomerService } from '../services/customer-service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { authenticate } from '../utils/auth-middleware.js';
import type { AuthenticatedRequest } from '../utils/auth-middleware.js';

const router = express.Router();
const customerService = new CustomerService();

router.post('/customers', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  const customer = await customerService.createCustomer({ ...req.body, businessId });
  res.status(201).json(customer);
}));

router.get('/customers/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  const customer = await customerService.getCustomer(Number(req.params.id), businessId);
  res.json(customer);
}));

router.get('/customers', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = Number(req.query.businessId) || req.user?.id;
  const customers = await customerService.getAllCustomers(businessId);
  res.json(customers);
}));

router.put('/customers/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  const customer = await customerService.updateCustomer(Number(req.params.id), businessId, req.body);
  res.json(customer);
}));

router.delete('/customers/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  await customerService.deleteCustomer(Number(req.params.id), businessId);
  res.status(204).send();
}));

export default router;
