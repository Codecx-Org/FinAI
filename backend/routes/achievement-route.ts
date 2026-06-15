import express from 'express';
import { achievementService } from '../services/achievement-service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { authenticate } from '../utils/auth-middleware.js';
import type { AuthenticatedRequest } from '../utils/auth-middleware.js';

const router = express.Router();

router.post('/achievements', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  
  const achievement = await achievementService.createAchievement({ 
    ...req.body, 
    businessId 
  });
  res.status(201).json(achievement);
}));

router.get('/achievements', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  
  const achievements = await achievementService.getAllAchievements(businessId);
  res.json(achievements);
}));

router.patch('/achievements/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  
  const achievement = await achievementService.updateAchievement(
    Number(req.params.id), 
    businessId, 
    req.body
  );
  res.json(achievement);
}));

router.delete('/achievements/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const businessId = req.user?.id;
  if (!businessId) return res.status(401).json({ error: 'Unauthorized' });
  
  await achievementService.deleteAchievement(Number(req.params.id), businessId);
  res.status(204).send();
}));

export default router;
