import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  ownerEmail: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  mpesaShortcode: z.string().optional(),
  whatsappNumber: z.string().optional(),
  ownerPhone: z.string().optional(),
  businessType: z.string().optional(),
  yearsInBusiness: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const businessUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  ownerName: z.string().min(2).optional(),
  ownerEmail: z.string().email().optional(),
  mpesaShortcode: z.string().optional(),
  whatsappNumber: z.string().optional(),
  ownerPhone: z.string().optional(),
  businessType: z.string().optional(),
  yearsInBusiness: z.string().optional(),
});
