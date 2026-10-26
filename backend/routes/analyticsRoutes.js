import express from 'express';
import { getDashboardAnalytics, getProfitAndLoss, getDailyEarnings } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/dashboard')
    .get(protect, authorize('SuperAdmin', 'RestaurantAdmin', 'BranchManager', 'Admin'), getDashboardAnalytics);

router.route('/profit-loss')
    .get(protect, authorize('SuperAdmin', 'RestaurantAdmin', 'BranchManager', 'Admin'), getProfitAndLoss);

router.route('/daily-earnings')
    .get(protect, authorize('SuperAdmin', 'RestaurantAdmin', 'BranchManager', 'Admin'), getDailyEarnings);

export default router;
