import { PrismaClient } from '@prisma/client';
import prisma from '../utils/prisma';


export class CustomerService {
  async createCustomer(data: { name: string; email?: string; phone?: string }) {
    return prisma.customer.create({
      data,
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });
  }

  async getCustomer(id: number) {
    return prisma.customer.findUnique({
      where: { id },
      include: { orders: true },
    });
  }

  async getAllCustomers() {
    return prisma.customer.findMany({
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });
  }

  async updateCustomer(id: number, data: { name?: string; email?: string; phone?: string }) {
    return prisma.customer.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });
  }

  async deleteCustomer(id: number) {
    return prisma.customer.delete({
      where: { id },
    });
  }
}