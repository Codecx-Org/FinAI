import express from 'express';
import { socialMediaService } from '../services/social-media-service.js';
import { pollinationsService } from '../services/pollinations-service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = express.Router();

// Generate social media content (text + image)
router.post('/content/generate-social-media', asyncHandler(async (req, res) => {
  const { platform, type, tone, description } = req.body;

  if (!platform || !type || !tone || !description) {
    return res.status(400).json({ error: 'Platform, type, tone, and description are required' });
  }

  const generatedContent = await socialMediaService.generateContent({
    platform,
    type,
    tone,
    description
  });

  console.log(generatedContent)
  res.json(generatedContent);
}));

// Generate product image
router.post('/content/generate-product-image', asyncHandler(async (req, res) => {
  const { productName, description } = req.body;

  if (!productName) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  const imageUrl = pollinationsService.generateImageUrl(`${productName}, ${description || ''}`, {
    width: 1024,
    height: 1024,
    enhance: true
  });

  res.json({ imageUrl });
}));

export default router;
