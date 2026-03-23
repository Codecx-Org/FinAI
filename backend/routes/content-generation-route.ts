import express from 'express';
import { socialMediaService } from '../services/social-media-service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = express.Router();

// POST /api/content/generate-social-media
router.post('/content/generate-social-media', asyncHandler(async (req, res) => {
  const { platform, type, tone, description } = req.body;

  if (!platform || !type || !tone || !description) {
    return res.status(400).json({ error: 'platform, type, tone, and description are required' });
  }

  const result = await socialMediaService.generateContent({ platform, type, tone, description });
  res.json(result);
}));

export default router;