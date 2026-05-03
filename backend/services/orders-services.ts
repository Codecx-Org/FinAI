import { redisService } from './redis-service.js';
import prisma from '../utils/prisma.js';
import { NotFoundError, InternalServerError, BadRequestError, AppError } from '../utils/types/errors.js';
import { OrderStatus, type OrderItem } from '../generated/prisma/client.js';
import { OrderItemService } from './orders-items-services.js';

const orderItemsService = new OrderItemService();

export class OrderService {
  async createOrder(orderData: { 
    customerId: number; 
    totalAmount: number; 
    status: OrderStatus; 
    businessId: number;
    orderItems?: Omit<OrderItem, "id" | "orderId">[] 
  }) {
    try {
      const order = await prisma.order.create({
        data: {
          totalAmount: orderData.totalAmount,
          customerId: orderData.customerId,
          status: orderData.status,
          businessId: orderData.businessId
        },
        include: { orderItems: true, customer: true, business: true },
      });

      if (orderData.orderItems) {
        for (const item of orderData.orderItems) {
          await orderItemsService.createOrderItem({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity
          });
        }
      }

      await redisService.publish('order:created', JSON.stringify({ orderId: order.id }));
      return order;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new InternalServerError('Failed to create order');
    }
  }

  async getOrder(id: number, businessId: number) {
    const order = await prisma.order.findUnique({
      where: { id, businessId },
      include: { orderItems: { include: { product: true } }, customer: true, sales: true, business: true },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }

  async getAllOrders(businessId?: number) {
    return await prisma.order.findMany({
      where: businessId ? { businessId } : {},
      include: { customer: true, business: true },
    });
  }

  async updateOrder(id: number, businessId: number, data: { customerId?: number; totalAmount?: number; status?: OrderStatus }) {
    const order = await prisma.order.findUnique({ where: { id, businessId } });
    if (!order) throw new NotFoundError('Order not found');

    try {
      const updated = await prisma.order.update({
        where: { id, businessId },
        data,
        include: { orderItems: true, customer: true, business: true },
      });

      // Event-driven state transitions
      if (data.status && order.status === OrderStatus.created && data.status === OrderStatus.paid) {
        await redisService.publish('order:payment_pending', JSON.stringify({ orderId: id }));
      } else if (data.status && data.status !== order.status) {
        await redisService.publish('order:status_updated', JSON.stringify({ orderId: id, newStatus: data.status }));
      }

      return updated;
    } catch (error: any) {
      throw new InternalServerError('Failed to update order');
    }
  }

  async deleteOrder(id: number, businessId: number) {
    try {
      await prisma.order.delete({ where: { id, businessId } });
      await redisService.publish('order:deleted', JSON.stringify({ orderId: id }));
    } catch (error: any) {
      if (error.code === 'P2025') throw new NotFoundError('Order not found');
      throw new InternalServerError('Failed to delete order');
    }
  }
}
