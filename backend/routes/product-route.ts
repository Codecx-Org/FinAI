import express from 'express';
import { ProductService } from '../services/products-service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { authenticate } from '../utils/auth-middleware.js';
import type { AuthenticatedRequest } from '../utils/auth-middleware.js';

const router = express.Router();
const productService = new ProductService();

router.post('/products', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  const product = await productService.createProduct({ ...req.body, businessId });
  res.status(201).json(product);
}));

router.get('/products/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  const product = await productService.getProduct(Number(req.params.id), businessId);
  res.json(product);
}));

router.get('/products', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = Number(req.query.businessId) || req.user?.id;
  const products = await productService.getAllProducts(businessId);
  res.json(products);
}));

router.post('/products/:id/generate-image', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  const product = await productService.generateProductImage(Number(req.params.id), businessId, req.body);
  res.json(product);
}));

router.put('/products/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  const product = await productService.updateProduct(Number(req.params.id), businessId, req.body);
  res.json(product);
}));

router.delete('/products/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  await productService.deleteProduct(Number(req.params.id), businessId);
  res.status(204).send();
}));

export default router;
