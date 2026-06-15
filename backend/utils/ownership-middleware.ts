import { type Response, type NextFunction } from 'express';
import { type AuthenticatedRequest } from './auth-middleware.js';
import { ForbiddenError } from './types/errors.js';

export const validateOwnership = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return next(new ForbiddenError('User not authenticated'));
  }

  // Check path params
  const paramId = req.params.id || req.params.businessId;
  if (paramId && Number(paramId) !== userId) {
    return next(new ForbiddenError('You do not have permission to access this resource'));
  }

  // Check query params
  const queryId = req.query.businessId || req.query.id;
  if (queryId && Number(queryId) !== userId) {
    return next(new ForbiddenError('You do not have permission to access this resource'));
  }

  // Check body (for updates/creates)
  const bodyId = req.body.businessId;
  if (bodyId && Number(bodyId) !== userId) {
    return next(new ForbiddenError('You cannot perform actions for another business'));
  }

  next();
};
