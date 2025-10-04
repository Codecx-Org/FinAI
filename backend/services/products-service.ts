import type { Product } from '../generated/prisma/index.js';
import prisma from '../utils/prisma.js';


export class ProductService {
  async createProduct(data: { name: string; stockQuantity: number; price: number; buyingPrice: number }) {
    return prisma.product.create({
      data,
      select: { id: true, name: true, stockQuantity: true, price: true, buyingPrice: true },
    });
  }

  async getProduct(id: number) {
    return prisma.product.findUnique({
      where: {
        id: id
      },
      include: { orderItems: true, sales: true },
    });
  }

  async getProductFilter(filters: Partial<Product>){
    return prisma.product.findMany({
      where: {
        ...filters
      }
    })
  }

  async getAllProducts() {
    return prisma.product.findMany({
      select: { id: true, name: true, stockQuantity: true, price: true, buyingPrice: true },
    });
  }

  async updateProduct(id: number, data: { name?: string; stockQuantity?: number; price?: number; buyingPrice?: number }) {
    return prisma.product.update({
      where: { id },
      data,
      select: { id: true, name: true, stockQuantity: true, price: true, buyingPrice: true },
    });
  }

  async deleteProduct(id: number) {
    return prisma.product.delete({ where: { id } });
  }
}