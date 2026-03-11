import prisma from '../utils/prisma.js';
import { NotFoundError, InternalServerError } from '../utils/types/errors.js';

export class CustomerService {
  async createCustomer(data: { name: string; email?: string; phone?: string; businessId: number }) {
    try {
      return await prisma.customer.create({
        data,
        select: { id: true, name: true, email: true, phone: true, createdAt: true, businessId: true },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('A customer with this email already exists');
      }
      throw new InternalServerError('Could not create customer');
    }
  }

  async getCustomer(id: number) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { orders: true, business: true },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }
    return customer;
  }

  async getAllCustomers(businessId?: number) {
    return prisma.customer.findMany({
      where: businessId ? { businessId } : {},
      select: { id: true, name: true, email: true, phone: true, createdAt: true, businessId: true },
    });
  }

  async updateCustomer(id: number, data: { name?: string; email?: string; phone?: string; businessId?: number }) {
    try {
      return await prisma.customer.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, phone: true, createdAt: true, businessId: true },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Customer not found');
      }
      throw new InternalServerError('Could not update customer');
    }
  }

  async deleteCustomer(id: number) {
    try {
      return await prisma.customer.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Customer not found');
      }
      throw new InternalServerError('Could not delete customer');
    }
  }
}
