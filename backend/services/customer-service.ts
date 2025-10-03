import prisma from '../utils/prisma.js';
import { InternalServerError, NotFoundError } from '../utils/types/errors.js';


export class CustomerService {
  async createCustomer(data: { name: string; email?: string; phone?: string }) {
    try {
      const customer = prisma.customer.create({
        data,
        select: { id: true, name: true, email: true, phone: true, createAt: true },
      });
      return customer
    } catch(error){
     throw new InternalServerError("Could not create customer") 
    }
  }

  async getCustomer(id: number) {
   try {
     const customer = prisma.customer.findUnique({
       where: { id },
       include: { orders: true },
     });

     if (!customer) {
       throw new NotFoundError("Customer not found")
     }
     return customer 
   }catch(error ){
      if (error instanceof NotFoundError){
        return error
      }
      return error
   }
  }

  async getAllCustomers() {
    return prisma.customer.findMany({
      select: { id: true, name: true, email: true, phone: true, createAt: true },
    });
  }

  async updateCustomer(id: number, data: { name?: string; email?: string; phone?: string }) {
    return prisma.customer.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, phone: true, createAt: true },
    });
  }

  async deleteCustomer(id: number) {
    return prisma.customer.delete({
      where: { id },
    });
  }
}