import prisma from "../utils/prisma";

export class SalesService {
  async createSale(data: { orderId: number; productId: number; quantity: number; totalAmount: number }) {
    return prisma.sales.create({
      data,
      select: { id: true, orderId: true, productId: true, quantity: true, totalAmount: true, createdAt: true },
    });
  }

  async getSale(id: number) {
    return prisma.sales.findUnique({
      where: { id },
      include: { order: true, product: true },
    });
  }

  async getAllSales() {
    return prisma.sales.findMany({
      include: { order: true, product: true },
    });
  }

  async updateSale(id: number, data: { orderId?: number; productId?: number; quantity?: number; totalAmount?: number }) {
    return prisma.sales.update({
      where: { id },
      data,
      select: { id: true, orderId: true, productId: true, quantity: true, totalAmount: true, createdAt: true },
    });
  }

  async deleteSale(id: number) {
    return prisma.sales.delete({ where: { id } });
  }
}