import express from 'express';
import { getTables, createTable, updateTableStatus, deleteTable } from '../controllers/tableController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, authorize('SuperAdmin', 'Admin', 'RestaurantAdmin', 'BranchManager', 'Waiter', 'Cashier'), getTables)
    .post(protect, authorize('SuperAdmin', 'Admin', 'RestaurantAdmin', 'BranchManager'), createTable);

router.route('/:id')
    .delete(protect, authorize('SuperAdmin', 'Admin', 'RestaurantAdmin', 'BranchManager'), deleteTable);

router.route('/:id/status')
    .put(protect, authorize('SuperAdmin', 'Admin', 'RestaurantAdmin', 'BranchManager', 'Waiter', 'Cashier'), updateTableStatus);

export default router;
