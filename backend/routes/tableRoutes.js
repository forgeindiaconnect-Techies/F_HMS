import express from 'express';
import { getTables, createTable, updateTableStatus } from '../controllers/tableController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, authorize('SuperAdmin', 'Admin', 'RestaurantAdmin', 'Manager', 'Waiter', 'Cashier'), getTables)
    .post(protect, authorize('SuperAdmin', 'Admin', 'RestaurantAdmin', 'Manager'), createTable);

router.route('/:id/status')
    .put(protect, authorize('SuperAdmin', 'Admin', 'RestaurantAdmin', 'Manager', 'Waiter', 'Cashier'), updateTableStatus);

export default router;
