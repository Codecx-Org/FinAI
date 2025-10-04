import prisma from "../utils/prisma.js";

export class OrderItemService {
  async createOrderItem(data: { orderId: number; productId: number; quantity: number }) {
    return prisma.orderItem.create({
      data,
      select: { id: true, orderId: true, productId: true, quantity: true },
    });
  }

  async getOrderItem(id: number) {
    return prisma.orderItem.findUnique({
      where: { id },
      include: { order: true, product: true },
    });
  }

  async getAllOrderItems() {
    return prisma.orderItem.findMany({
      include: { order: true, product: true },
    });
  }

  async updateOrderItem(id: number, data: { orderId?: number; productId?: number; quantity?: number }) {
    return prisma.orderItem.update({
      where: { id },
      data,
      select: { id: true, orderId: true, productId: true, quantity: true },
    });
  }

  async deleteOrderItem(id: number) {
    return prisma.orderItem.delete({ where: { id } });
  }
}