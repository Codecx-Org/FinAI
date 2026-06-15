import prisma from '../utils/prisma.js';
import { NotFoundError, InternalServerError, BadRequestError } from '../utils/types/errors.js';
import { pollinationsService } from './pollinations-service.js';

const productSelect = {
  id: true,
  name: true,
  category: true,
  stockQuantity: true,
  price: true,
  buyingPrice: true,
  businessId: true,
  imageUrl: true,
  supplier: true,
  minStockLevel: true,
  maxStockLevel: true,
  lastRestockedAt: true,
  createdAt: true,
} as const;

export type CreateProductPayload = {
  name: string;
  stockQuantity: number;
  price: number;
  buyingPrice: number;
  businessId: number;
  imageUrl?: string;
  category?: string | null;
  supplier?: string | null;
  minStockLevel?: number | null;
  maxStockLevel?: number | null;
  lastRestockedAt?: string | Date | null;
};

export class ProductService {
  async createProduct(data: CreateProductPayload) {
    if (data.price < 0 || data.buyingPrice < 0) {
      throw new BadRequestError('Price and buying price must be non-negative');
    }

    const lastRestocked =
      data.lastRestockedAt === undefined || data.lastRestockedAt === null
        ? undefined
        : new Date(data.lastRestockedAt);

    try {
      return await prisma.product.create({
        data: {
          name: data.name,
          stockQuantity: data.stockQuantity,
          price: data.price,
          buyingPrice: data.buyingPrice,
          businessId: data.businessId,
          imageUrl: data.imageUrl,
          category: data.category ?? undefined,
          supplier: data.supplier ?? undefined,
          minStockLevel: data.minStockLevel ?? undefined,
          maxStockLevel: data.maxStockLevel ?? undefined,
          lastRestockedAt: lastRestocked,
        },
        select: productSelect,
      });
    } catch (error: any) {
      throw new InternalServerError('Could not create product');
    }
  }

  /**
   * Automatically generates and updates a product image using AI.
   *
   * @param id - The ID of the product.
   * @param businessId - The ID of the business.
   * @param options - Generation options.
   * @returns The updated product.
   */
  async generateProductImage(id: number, businessId: number, options: any = {}) {
    const product = await prisma.product.findUnique({ where: { id, businessId } });
    if (!product) throw new NotFoundError('Product not found');

    const imageUrl = pollinationsService.generateImageUrl(product.name, options);

    return await prisma.product.update({
      where: { id, businessId },
      data: { imageUrl },
      select: productSelect,
    });
  }

  async getProduct(id: number, businessId: number) {
    const product = await prisma.product.findUnique({
      where: { id, businessId },
      include: { orderItems: true, sales: true },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  async getProductFilter(filters: any, businessId: number) {
    return await prisma.product.findMany({
      where: { ...filters, businessId },
    });
  }

  async getAllProducts(businessId?: number) {
    return await prisma.product.findMany({
      where: businessId ? { businessId } : {},
      select: productSelect,
    });
  }

  async updateProduct(
    id: number,
    businessId: number,
    data: {
      name?: string;
      category?: string | null;
      stockQuantity?: number;
      price?: number;
      buyingPrice?: number;
      imageUrl?: string | null;
      supplier?: string | null;
      minStockLevel?: number | null;
      maxStockLevel?: number | null;
      lastRestockedAt?: string | Date | null;
    },
  ) {
    const product = await prisma.product.findUnique({ where: { id }, select: { businessId: true } });
    if (!product || product.businessId !== businessId) {
      throw new NotFoundError('Product not found or not accessible');
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.lastRestockedAt !== undefined) {
      updateData.lastRestockedAt =
        data.lastRestockedAt === null ? null : new Date(data.lastRestockedAt);
    }

    try {
      return await prisma.product.update({
        where: { id },
        data: updateData,
        select: productSelect,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Product not found');
      }
      throw new InternalServerError('Could not update product');
    }
  }

  async deleteProduct(id: number, businessId: number) {
    const product = await prisma.product.findUnique({ where: { id }, select: { businessId: true } });
    if (!product || product.businessId !== businessId) {
      throw new NotFoundError('Product not found or not accessible');
    }
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
