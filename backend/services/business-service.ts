import prisma from '../utils/prisma.js';
import { BadRequestError, NotFoundError } from '../utils/types/errors.js';
import bcrypt from 'bcryptjs';

/** Remove secrets before sending Business over HTTP. */
export function toPublicBusiness<T extends { password?: string } | null | undefined>(
  business: T,
): Omit<NonNullable<T>, 'password'> | null | undefined {
  if (business == null) return business as null | undefined;
  const { password: _p, ...rest } = business as { password?: string } & Record<string, unknown>;
  return rest as Omit<NonNullable<T>, 'password'>;
}

export class BusinessService {
  async createBusiness(data: {
    name: string;
    mpesaShortcode?: string;
    ownerName: string;
    ownerEmail: string;
    whatsappNumber?: string;
    password: string;
    metadata?: any;
    businessType?: string;
    yearsInBusiness?: string;
  }) {
    const existing = await prisma.business.findUnique({
      where: { ownerEmail: data.ownerEmail },
    });

    if (existing) {
      throw new BadRequestError('Business with this owner email already exists');
    }

    if (data.whatsappNumber) {
      const existingWhatsapp = await prisma.business.findUnique({
        where: { whatsappNumber: data.whatsappNumber },
      });
      if (existingWhatsapp) {
        throw new BadRequestError('Business with this WhatsApp number already exists');
      }
    }

    if (data.mpesaShortcode) {
      const existingShortcode = await prisma.business.findUnique({
        where: { mpesaShortcode: data.mpesaShortcode },
      });
      if (existingShortcode) {
        throw new BadRequestError('Business with this mpesa shortcode already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.business.create({
      data: {
        ...data,
        password: hashedPassword,
      },
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

  async getBusinessByEmail(email: string) {
    return prisma.business.findUnique({
      where: { ownerEmail: email },
    });
  }

  async getBusinessByWhatsapp(whatsappNumber: string) {
    return prisma.business.findUnique({
      where: { whatsappNumber },
    });
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

    const { password: _ignore, ...safeData } = data || {};
    return prisma.business.update({
      where: { id },
      data: safeData,
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
