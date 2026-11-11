import express from 'express';
import { getDashboardAnalytics, getProfitAndLoss, getDailyEarnings } from '../controllers/analyticsController.js';
import { protect, authorize, checkSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(checkSubscription);

router.route('/dashboard')
    .get(authorize('SuperAdmin', 'RestaurantAdmin', 'BranchManager', 'Admin'), getDashboardAnalytics);

router.route('/profit-loss')
    .get(authorize('SuperAdmin', 'RestaurantAdmin', 'BranchManager', 'Admin'), getProfitAndLoss);

router.route('/daily-earnings')
    .get(authorize('SuperAdmin', 'RestaurantAdmin', 'BranchManager', 'Admin'), getDailyEarnings);

export default router;
