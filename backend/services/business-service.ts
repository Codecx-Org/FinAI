import prisma from '../utils/prisma.js';
import { BadRequestError, NotFoundError } from '../utils/types/errors.js';

export class BusinessService {
  async createBusiness(data: {
    name: string;
    mpesaShortcode?: string;
    ownerName: string;
    ownerEmail: string;
    metadata?: any;
  }) {
    const existing = await prisma.business.findUnique({
      where: { ownerEmail: data.ownerEmail },
    });

    if (existing) {
      throw new BadRequestError('Business with this owner email already exists');
    }

    if (data.mpesaShortcode) {
      const existingShortcode = await prisma.business.findUnique({
        where: { mpesaShortcode: data.mpesaShortcode },
      });
      if (existingShortcode) {
        throw new BadRequestError('Business with this mpesa shortcode already exists');
      }
    }

    return prisma.business.create({
      data,
    });
  }

  async getBusinessById(id: number) {
    const business = await prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    return business;
  }

  async getAllBusinesses() {
    return prisma.business.findMany();
  }

  async updateBusiness(id: number, data: any) {
    const business = await prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    return prisma.business.update({
      where: { id },
      data,
    });
  }

  async deleteBusiness(id: number) {
    const business = await prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    return prisma.business.delete({
      where: { id },
    });
  }
}

export const businessService = new BusinessService();
