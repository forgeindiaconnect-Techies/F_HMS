import express from 'express';
import {
    getKOTs,
    getKOTById,
    updateKOTStatus,
    markKOTPrinted,
    manualCreateKOT,
    getKOTSummary
} from '../controllers/kotController.js';
import { protect, authorize, checkSubscription, checkBillingModule } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(checkSubscription);
router.use(authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager', 'Chef', 'Waiter', 'Cashier'));
router.use(checkBillingModule(['kot', 'kitchenOrderManagement']));

router.route('/')
    .get(getKOTs)
    .post(manualCreateKOT);

router.route('/summary')
    .get(getKOTSummary);

router.route('/:id')
    .get(getKOTById);

router.route('/:id/status')
    .put(updateKOTStatus);

router.route('/:id/print')
    .put(markKOTPrinted);

export default router;
