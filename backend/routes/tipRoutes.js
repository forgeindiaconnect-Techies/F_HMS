import express from 'express';
import { getTips, getTipSummary, getMyWaiterTips, settleTips } from '../controllers/tipController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Waiter's own tips
router.route('/waiter-mine')
    .get(protect, authorize('Waiter', 'RestaurantAdmin', 'BranchManager', 'SuperAdmin'), getMyWaiterTips);

// Reports summary
router.route('/summary')
    .get(protect, authorize('RestaurantAdmin', 'BranchManager', 'SuperAdmin', 'Admin'), getTipSummary);

// Settle tips
router.route('/settle')
    .post(protect, authorize('RestaurantAdmin', 'BranchManager', 'SuperAdmin', 'Admin'), settleTips);

// List all tips with filters
router.route('/')
    .get(protect, authorize('RestaurantAdmin', 'BranchManager', 'SuperAdmin', 'Admin'), getTips);

export default router;
