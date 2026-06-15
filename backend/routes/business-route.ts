import express from 'express';
import { businessService, toPublicBusiness } from '../services/business-service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validateOwnership } from '../utils/ownership-middleware.js';
import { ForbiddenError } from '../utils/types/errors.js';

const router = express.Router();

router.post('/business', asyncHandler(async (req, res) => {
  const business = await businessService.createBusiness(req.body);
  res.status(201).json(toPublicBusiness(business));
}));

router.get('/business/:id', validateOwnership, asyncHandler(async (req, res) => {
  const business = await businessService.getBusinessById(Number(req.params.id));
  res.json(toPublicBusiness(business));
}));

// Restricted global listing - only allow users to see their own if no ID provided? 
// Or just return a 403. For now, let's return a 403 to be safe.
router.get('/business', asyncHandler(async (req, res) => {
  throw new ForbiddenError('Listing all businesses is not allowed');
}));

router.put('/business/:id', validateOwnership, asyncHandler(async (req, res) => {
  const business = await businessService.updateBusiness(Number(req.params.id), req.body);
  res.json(toPublicBusiness(business));
}));

router.delete('/business/:id', validateOwnership, asyncHandler(async (req, res) => {
  await businessService.deleteBusiness(Number(req.params.id));
  res.status(204).send();
}));

export default router;
