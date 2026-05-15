import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { BusinessService } from './business-service.js';
import { BadRequestError, UnauthorizedError } from '../utils/types/errors.js';

const businessService = new BusinessService();

export class AuthService {
  private secret: string;

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET must be defined in environment variables');
    }
    this.secret = secret;
  }

  async register(data: any) {
    return businessService.createBusiness(data);
  }

  async login(email: string, password: string) {
    const business = await businessService.getBusinessByEmail(email);

    if (!business) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, business.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = jwt.sign(
      { id: business.id, email: business.ownerEmail },
      this.secret,
      { expiresIn: '24h' }
    );

    return {
      business: {
        id: business.id,
        name: business.name,
        ownerName: business.ownerName,
        ownerEmail: business.ownerEmail,
      },
      token,
    };
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, this.secret) as { id: number; email: string };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}

export const authService = new AuthService();
