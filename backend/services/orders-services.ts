import { redisService } from './redis-service.js';
import prisma from '../utils/prisma.js';
import { NotFoundError } from '../utils/types/errors.js';
import { OrderStatus } from '../generated/prisma/client.js';


export class OrderService {
  async createOrder(data: { customerId: number; totalAmount: number; status: OrderStatus }) {
    const order = await prisma.order.create({
      data,
      include: { orderItems: true, customer: true },
    });
    // Publish order creation event if needed
    await redisService.publish('order:created', JSON.stringify({ orderId: order.id }));
    return order;
  }

  async getOrder(id: number) {
    const order = prisma.order.findUnique({
      where: { id },
      include: { orderItems: { include: { product: true } }, customer: true, sales: true },
    });

    if (!order){
      throw new NotFoundError("order not found")
    }

    return order   
  }

  async getAllOrders() {
    return prisma.order.findMany({
      include: { customer: true },
    });
  }

  async updateOrder(id: number, data: { customerId: number; totalAmount?: number; status: OrderStatus }) {
    try{
      const order = await prisma.order.findUnique({ where: { id } });
      if (!order) throw new NotFoundError('Order not found');

      const updated = await prisma.order.update({
        where: { id },
        data,
        include: { orderItems: true, customer: true },
      });

      // Publish event for status change
      if (data.status && order.status === OrderStatus.created && data.status === OrderStatus.paid) {
        //here we publish the order payment pending so that the payment subscriber can automatically
        //subscribe to the data publised
        await redisService.publish('order:payment_pending', JSON.stringify({ orderId: id }));
      } else if (data.status) {
        await redisService.publish('order:status_updated', JSON.stringify({ orderId: id, newStatus: data.status }));
      }

      return updated;

    } catch(error){
        return error
    }
  }

  async deleteOrder(id: number) {
    await prisma.order.delete({ where: { id } });
    await redisService.publish('order:deleted', JSON.stringify({ orderId: id }));
  }
}
