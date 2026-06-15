import prisma from '../utils/prisma.js';
import { NotFoundError, InternalServerError } from '../utils/types/errors.js';

export class AchievementService {
  async createAchievement(data: { title: string; description?: string; businessId: number }) {
    try {
      return await prisma.businessAchievement.create({
        data: {
          title: data.title,
          description: data.description,
          businessId: data.businessId,
        },
      });
    } catch (error: any) {
      throw new InternalServerError('Could not create achievement');
    }
  }

  async getAllAchievements(businessId: number) {
    return await prisma.businessAchievement.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAchievement(
    id: number,
    businessId: number,
    data: { title?: string; description?: string; earned?: boolean }
  ) {
    const achievement = await prisma.businessAchievement.findUnique({
      where: { id },
    });

    if (!achievement || achievement.businessId !== businessId) {
      throw new NotFoundError('Achievement not found');
    }

    const updateData: any = { ...data };
    if (data.earned !== undefined) {
      updateData.earnedAt = data.earned ? new Date() : null;
    }

    try {
      return await prisma.businessAchievement.update({
        where: { id },
        data: updateData,
      });
    } catch (error: any) {
      throw new InternalServerError('Could not update achievement');
    }
  }

  async deleteAchievement(id: number, businessId: number) {
    const achievement = await prisma.businessAchievement.findUnique({
      where: { id },
    });

    if (!achievement || achievement.businessId !== businessId) {
      throw new NotFoundError('Achievement not found');
    }

    try {
      await prisma.businessAchievement.delete({
        where: { id },
      });
    } catch (error: any) {
      throw new InternalServerError('Could not delete achievement');
    }
  }
}

export const achievementService = new AchievementService();
