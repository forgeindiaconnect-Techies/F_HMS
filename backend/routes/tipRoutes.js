import express from 'express';
import { getTips, getTipSummary, getMyWaiterTips, settleTips } from '../controllers/tipController.js';
import { protect, authorize, checkSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(checkSubscription);

// Waiter's own tips
router.route('/waiter-mine')
    .get(authorize('Waiter', 'RestaurantAdmin', 'BranchManager', 'SuperAdmin'), getMyWaiterTips);

// Reports summary
router.route('/summary')
    .get(authorize('RestaurantAdmin', 'BranchManager', 'SuperAdmin', 'Admin'), getTipSummary);

// Settle tips
router.route('/settle')
    .post(authorize('RestaurantAdmin', 'BranchManager', 'SuperAdmin', 'Admin'), settleTips);

// List all tips with filters
router.route('/')
    .get(authorize('RestaurantAdmin', 'BranchManager', 'SuperAdmin', 'Admin'), getTips);

export default router;
