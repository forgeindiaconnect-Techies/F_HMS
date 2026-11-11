import express from 'express';
import { getTables, createTable, updateTableStatus, deleteTable } from '../controllers/tableController.js';
import { authorize, protect, checkSubscription, checkBillingModule } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(checkSubscription);

router.route('/')
    .get(checkBillingModule('tableManagement'), authorize('SuperAdmin', 'Admin', 'RestaurantAdmin', 'BranchManager', 'Waiter', 'Cashier'), getTables)
    .post(checkBillingModule('tableManagement'), authorize('SuperAdmin', 'Admin', 'RestaurantAdmin', 'BranchManager'), createTable);

router.route('/:id')
    .delete(checkBillingModule('tableManagement'), authorize('SuperAdmin', 'Admin', 'RestaurantAdmin', 'BranchManager'), deleteTable);

router.route('/:id/status')
    .put(checkBillingModule('tableManagement'), authorize('SuperAdmin', 'Admin', 'RestaurantAdmin', 'BranchManager', 'Waiter', 'Cashier'), updateTableStatus);

export default router;
