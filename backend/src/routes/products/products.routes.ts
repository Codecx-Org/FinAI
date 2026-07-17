import type { FastifyInstance } from 'fastify';
import { ProductService } from '../../../services/products-service.js';

const productService = new ProductService();

/**
 * Product Routes (all protected — require JWT)
 * GET    /api/products           - List all products
 * GET    /api/products/:id       - Get product by ID
 * POST   /api/products           - Create product
 * PUT    /api/products/:id       - Update product
 * DELETE /api/products/:id       - Delete product
 * POST   /api/products/:id/image - Generate AI product image
 */
export async function productRoutes(fastify: FastifyInstance) {
  fastify.get('/products', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const products = await productService.getAllProducts(businessId);
    return reply.send({ success: true, data: products });
  });

  fastify.get<{ Params: { id: string } }>('/products/:id', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const product = await productService.getProduct(Number(req.params.id), businessId);
    return reply.send({ success: true, data: product });
  });

  fastify.post('/products', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'price', 'buyingPrice', 'stockQuantity'],
        properties: {
          name: { type: 'string', minLength: 1 },
          price: { type: 'number', minimum: 0 },
          buyingPrice: { type: 'number', minimum: 0 },
          stockQuantity: { type: 'number', minimum: 0 },
          category: { type: 'string' },
          supplier: { type: 'string' },
          minStockLevel: { type: 'number' },
          maxStockLevel: { type: 'number' },
        },
      },
    },
  }, async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const body = req.body as any;
    const product = await productService.createProduct({ ...body, businessId });
    return reply.status(201).send({ success: true, data: product });
  });

  fastify.put<{ Params: { id: string } }>('/products/:id', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const product = await productService.updateProduct(
      Number(req.params.id),
      businessId,
      req.body as any
    );
    return reply.send({ success: true, data: product });
  });

  fastify.delete<{ Params: { id: string } }>('/products/:id', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    await productService.deleteProduct(Number(req.params.id), businessId);
    return reply.send({ success: true, message: 'Product deleted' });
  });

  fastify.post<{ Params: { id: string } }>('/products/:id/image', async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const product = await productService.generateProductImage(
      Number(req.params.id),
      businessId,
      (req.body as any) || {}
    );
    return reply.send({ success: true, data: product });
  });
}
