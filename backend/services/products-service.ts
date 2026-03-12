import prisma from '../utils/prisma.js';
import { NotFoundError, InternalServerError, BadRequestError } from '../utils/types/errors.js';
import { pollinationsService } from './pollinations-service.js';

export class ProductService {
  async createProduct(data: { name: string; stockQuantity: number; price: number; buyingPrice: number; businessId: number; imageUrl?: string }) {
    if (data.price < 0 || data.buyingPrice < 0) {
      throw new BadRequestError('Price and buying price must be non-negative');
    }
    
    try {
      return await prisma.product.create({
        data,
        select: { id: true, name: true, stockQuantity: true, price: true, buyingPrice: true, businessId: true, imageUrl: true },
      });
    } catch (error: any) {
      throw new InternalServerError('Could not create product');
    }
  }

  /**
   * Automatically generates and updates a product image using AI.
   * 
   * @param id - The ID of the product.
   * @param options - Generation options.
   * @returns The updated product.
   */
  async generateProductImage(id: number, options: any = {}) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('Product not found');

    const imageUrl = pollinationsService.generateImageUrl(product.name, options);
    
    return await prisma.product.update({
      where: { id },
      data: { imageUrl },
      select: { id: true, name: true, stockQuantity: true, price: true, buyingPrice: true, businessId: true, imageUrl: true }
    });
  }

  async getProduct(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { orderItems: true, sales: true, business: true },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  async getProductFilter(filters: any) {
    return await prisma.product.findMany({
      where: filters,
    });
  }

  async getAllProducts(businessId?: number) {
    return await prisma.product.findMany({
      where: businessId ? { businessId } : {},
      select: { id: true, name: true, stockQuantity: true, price: true, buyingPrice: true, businessId: true, imageUrl: true },
    });
  }

  async updateProduct(id: number, data: { name?: string; stockQuantity?: number; price?: number; buyingPrice?: number; businessId?: number; imageUrl?: string }) {
    try {
      return await prisma.product.update({
        where: { id },
        data,
        select: { id: true, name: true, stockQuantity: true, price: true, buyingPrice: true, businessId: true, imageUrl: true },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Product not found');
      }
      throw new InternalServerError('Could not update product');
    }
  }

  async deleteProduct(id: number) {
    try {
      return await prisma.product.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Product not found');
      }
      throw new InternalServerError('Could not delete product');
    }
  }
}
