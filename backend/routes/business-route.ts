import express from 'express';
import { businessService, toPublicBusiness } from '../services/business-service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = express.Router();

router.post('/business', asyncHandler(async (req, res) => {
  const business = await businessService.createBusiness(req.body);
  res.status(201).json(toPublicBusiness(business));
}));

router.get('/business/:id', asyncHandler(async (req, res) => {
  const business = await businessService.getBusinessById(Number(req.params.id));
  res.json(toPublicBusiness(business));
}));

router.get('/business', asyncHandler(async (req, res) => {
  const businesses = await businessService.getAllBusinesses();
  res.json(businesses.map((b) => toPublicBusiness(b)));
}));

router.put('/business/:id', asyncHandler(async (req, res) => {
  const business = await businessService.updateBusiness(Number(req.params.id), req.body);
  res.json(toPublicBusiness(business));
}));

router.delete('/business/:id', asyncHandler(async (req, res) => {
  await businessService.deleteBusiness(Number(req.params.id));
  res.status(204).send();
}));

export default router;
