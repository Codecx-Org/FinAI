import express from 'express';
import { CustomerService } from '../services/customer-service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = express.Router();
const customerService = new CustomerService();

router.post('/customers', asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  res.status(201).json(customer);
}));

router.get('/customers/:id', asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomer(Number(req.params.id));
  res.json(customer);
}));

router.get('/customers', asyncHandler(async (req, res) => {
  const customers = await customerService.getAllCustomers();
  res.json(customers);
}));

router.put('/customers/:id', asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(Number(req.params.id), req.body);
  res.json(customer);
}));

router.delete('/customers/:id', asyncHandler(async (req, res) => {
  await customerService.deleteCustomer(Number(req.params.id));
  res.status(204).send();
}));

export default router;
