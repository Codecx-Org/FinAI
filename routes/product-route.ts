import express from 'express';
import { ProductService } from '../services/products-service';

const router = express.Router();
const productService = new ProductService();

router.post('/products', async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await productService.getProduct(Number(req.params.id));
    if (!product) throw new Error('Product not found');
    res.json(product);
  } catch (error) {
    res.status(404).json({ error: 'Product not found' });
  }
});

router.get('/products', async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const product = await productService.updateProduct(Number(req.params.id), req.body);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await productService.deleteProduct(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;