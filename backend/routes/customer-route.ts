import express from 'express';
import { CustomerService } from '../services/customer-service';

const router = express.Router();
const customerService = new CustomerService();

router.post('/customers', async (req, res) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await customerService.getCustomer(Number(req.params.id));
    if (!customer) throw new Error('Customer not found');
    res.json(customer);
  } catch (error) {
    res.status(404).json({ error: 'Customer not found' });
  }
});

router.get('/customers', async (req, res) => {
  try {
    const customers = await customerService.getAllCustomers();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const customer = await customerService.updateCustomer(Number(req.params.id), req.body);
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    await customerService.deleteCustomer(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;