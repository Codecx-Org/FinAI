import { Router, type Request, type Response } from 'express';
import { authService } from '../services/auth-service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new business owner
 */
router.post('/auth/register', asyncHandler(async (req: Request, res: Response) => {
  const business = await authService.register(req.body);
  res.status(201).json({
    message: 'Business registered successfully',
    businessId: business.id
  });
}));

/**
 * @route POST /api/auth/login
 * @desc Login as a business owner
 */
router.post('/auth/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const result = await authService.login(email, password);
  res.json(result);
}));

export default router;
