import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { BusinessService } from './business-service.js';
import { BadRequestError, UnauthorizedError } from '../utils/types/errors.js';
import prisma from '../utils/prisma.js';

const businessService = new BusinessService();

export class AuthService {
  private secret: string;
  private googleClient: OAuth2Client;

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET must be defined in environment variables');
    }
    this.secret = secret;
    this.googleClient = new OAuth2Client();
  }

  async register(data: any) {
    return businessService.createBusiness(data);
  }

  async login(email: string, password: string) {
    const business = await businessService.getBusinessByEmail(email);

    if (!business || !business.password) {
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

  async googleLogin(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: [
          process.env.GOOGLE_ANDROID_CLIENT_ID!,
          process.env.GOOGLE_IOS_CLIENT_ID!,
          process.env.GOOGLE_WEB_CLIENT_ID!,
        ].filter(Boolean),
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedError('Invalid Google token');
      }

      const { sub: googleId, email, name } = payload;

      // 1. Try finding by googleId
      let business = await prisma.business.findUnique({
        where: { googleId },
      });

      // 2. If not found, try finding by email and link
      if (!business) {
        business = await prisma.business.findUnique({
          where: { ownerEmail: email },
        });

        if (business) {
          business = await prisma.business.update({
            where: { id: business.id },
            data: { googleId },
          });
        }
      }

      // 3. If still not found, create new business
      if (!business) {
        business = await prisma.business.create({
          data: {
            ownerEmail: email,
            ownerName: name || 'Google User',
            name: `${name || 'My'}'s Business`,
            googleId,
          },
        });
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
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      throw new UnauthorizedError('Google authentication failed');
    }
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
