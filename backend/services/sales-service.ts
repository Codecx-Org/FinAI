import prisma from "../utils/prisma.js";
import { NotFoundError, InternalServerError } from '../utils/types/errors.js';

export class SalesService {
  async createSale(data: { orderId: number; productId: number; quantity: number; totalAmount: number; businessId: number }) {
    try {
      return await prisma.sales.create({
        data,
        select: { id: true, orderId: true, productId: true, quantity: true, totalAmount: true, createdAt: true, businessId: true },
      });
    } catch (error) {
      throw new InternalServerError('Failed to create sale record');
    }
  }

  async getSale(id: number) {
    const sale = await prisma.sales.findUnique({
      where: { id },
      include: { order: true, product: true, business: true },
    });
    if (!sale) throw new NotFoundError('Sale not found');
    return sale;
  }

  async getAllSales(businessId?: number) {
    return await prisma.sales.findMany({
      where: businessId ? { businessId } : {},
      include: { order: true, product: true, business: true },
    });
  }

  async updateSale(id: number, data: any) {
    try {
      return await prisma.sales.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === 'P2025') throw new NotFoundError('Sale not found');
      throw new InternalServerError('Failed to update sale');
    }
  }

  async deleteSale(id: number) {
    try {
      await prisma.sales.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === 'P2025') throw new NotFoundError('Sale not found');
      throw new InternalServerError('Failed to delete sale');
    }
  }
}
