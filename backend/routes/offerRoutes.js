import express from 'express';
import { getOffers, createOffer, updateOffer, deleteOffer } from '../controllers/offerController.js';
import { protect, authorize, checkSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / Customer endpoint to get offers
router.get('/', getOffers);

// Protected routes for Admin & Manager to create, update, delete offers
router.post('/', protect, authorize('RestaurantAdmin', 'BranchManager'), checkSubscription, createOffer);
router.put('/:id', protect, authorize('RestaurantAdmin', 'BranchManager'), checkSubscription, updateOffer);
router.delete('/:id', protect, authorize('RestaurantAdmin', 'BranchManager'), checkSubscription, deleteOffer);

export default router;
