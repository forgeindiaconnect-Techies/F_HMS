import express from 'express';
import { getOffers, createOffer, updateOffer, deleteOffer } from '../controllers/offerController.js';
import { protect, authorize, checkSubscription, checkBillingModule } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / Customer endpoint to get offers
router.get('/', getOffers);

// Protected routes for Admin & Manager to create, update, delete offers
router.post('/', protect, authorize('RestaurantAdmin', 'BranchManager'), checkBillingModule('discounts'), checkSubscription, createOffer);
router.put('/:id', protect, authorize('RestaurantAdmin', 'BranchManager'), checkBillingModule('discounts'), checkSubscription, updateOffer);
router.delete('/:id', protect, authorize('RestaurantAdmin', 'BranchManager'), checkBillingModule('discounts'), checkSubscription, deleteOffer);

export default router;
