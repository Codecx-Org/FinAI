import { Router, type Request, type Response } from 'express';
import { authService } from '../services/auth-service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { registerSchema, loginSchema } from '../utils/validators.js';
import { BadRequestError } from '../utils/types/errors.js';
import { getFirstZodMessage } from '../utils/zod-errors.js';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new business owner
 */
router.post('/auth/register', asyncHandler(async (req: Request, res: Response) => {
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    throw new BadRequestError(getFirstZodMessage(validation.error));
  }

  const business = await authService.register(validation.data);
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
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    throw new BadRequestError(getFirstZodMessage(validation.error));
  }

  const { email, password } = validation.data;
  const result = await authService.login(email, password);
  res.json(result);
}));

/**
 * @route POST /api/auth/google
 * @desc Login with Google
 */
router.post('/auth/google', asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) {
    throw new BadRequestError('ID Token is required');
  }

  const result = await authService.googleLogin(idToken);
  res.json(result);
}));

export default router;
