import express from 'express';
import { ProductService } from '../services/products-service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = express.Router();
const productService = new ProductService();

router.post('/products', asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json(product);
}));

router.get('/products/:id', asyncHandler(async (req, res) => {
  const product = await productService.getProduct(Number(req.params.id));
  res.json(product);
}));

router.get('/products', asyncHandler(async (req, res) => {
  const products = await productService.getAllProducts();
  res.json(products);
}));

router.put('/products/:id', asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(Number(req.params.id), req.body);
  res.json(product);
}));

router.delete('/products/:id', asyncHandler(async (req, res) => {
  await productService.deleteProduct(Number(req.params.id));
  res.status(204).send();
}));

export default router;
