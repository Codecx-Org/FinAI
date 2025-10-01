import prisma from '../utils/prisma';


export class ProductService {
  async createProduct(data: { name: string; stockQuantity: number; price: number; buyingPrice: number }) {
    return prisma.product.create({
      data,
      select: { id: true, name: true, stockQuantity: true, price: true, buyingPrice: true },
    });
  }

  async getProduct(id: number) {
    return prisma.product.findUnique({
      where: { id },
      include: { orderItems: true, sales: true },
    });
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