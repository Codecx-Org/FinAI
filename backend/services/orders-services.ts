import { redisService } from './redis-service';
import prisma from '../utils/prisma';


export class OrderService {
  async createOrder(data: { customerId?: number; totalAmount: number; status: string }) {
    const order = await prisma.order.create({
      data,
      include: { orderItems: true, customer: true },
    });
    // Publish order creation event if needed
    await redisService.publish('order:created', JSON.stringify({ orderId: order.id }));
    return order;
  }

  async getOrder(id: number) {
    return prisma.order.findUnique({
      where: { id },
      include: { orderItems: { include: { product: true } }, customer: true, sales: true },
    });
  }

  async getAllOrders() {
    return prisma.order.findMany({
      include: { customer: true },
    });
  }

  async updateOrder(id: number, data: { customerId?: number; totalAmount?: number; status?: string }) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('Order not found');

    const updated = await prisma.order.update({
      where: { id },
      data,
      include: { orderItems: true, customer: true },
    });

    // Publish event for status change
    if (data.status && order.status === 'created' && data.status === 'completed') {
      await redisService.publish('order:payment_pending', JSON.stringify({ orderId: id }));
    } else if (data.status) {
      await redisService.publish('order:status_updated', JSON.stringify({ orderId: id, newStatus: data.status }));
    }

    return updated;
  }

  async deleteOrder(id: number) {
    await prisma.order.delete({ where: { id } });
    await redisService.publish('order:deleted', JSON.stringify({ orderId: id }));
  }
}