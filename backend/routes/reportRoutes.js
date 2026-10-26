import express from 'express';
import { generateReport } from '../controllers/reportController.js';
import { protect, authorize, checkSubscription, checkBillingModule } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('RestaurantAdmin', 'BranchManager', 'SuperAdmin'));
router.use(checkSubscription);
router.use(checkBillingModule('salesReports'));

router.route('/generate')
    .post(generateReport);

export default router;
