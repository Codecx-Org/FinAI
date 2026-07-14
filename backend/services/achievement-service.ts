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
    const list = await prisma.businessAchievement.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    if (list.length === 0) {
      // Auto-seed default achievements for new businesses
      const defaults = [
        { title: 'Consistent Earner', description: '6 months of steady revenue', earned: true, earnedAt: new Date() },
        { title: 'Payment Master', description: 'No late payments in 3 months', earned: true, earnedAt: new Date() },
        { title: 'Growth Champion', description: '20% month-over-month growth', earned: false },
        { title: 'Customer Favorite', description: '4.5+ customer rating', earned: true, earnedAt: new Date() },
      ];
      
      try {
        await prisma.businessAchievement.createMany({
          data: defaults.map(d => ({
            title: d.title,
            description: d.description,
            earned: d.earned,
            earnedAt: d.earnedAt,
            businessId,
          })),
        });
        
        return await prisma.businessAchievement.findMany({
          where: { businessId },
          orderBy: { createdAt: 'desc' },
        });
      } catch (error) {
        console.error('Failed to seed achievements:', error);
      }
    }

    return list;
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
