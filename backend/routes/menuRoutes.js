import express from 'express';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menuController.js';
import { protect, optionalProtect, authorize, checkSubscription, checkBillingModule } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(optionalProtect, getMenuItems)
    .post(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager', 'Chef'), checkBillingModule('menuManagement'), createMenuItem);

router.route('/:id')
    .put(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager', 'Chef'), checkBillingModule('menuManagement'), updateMenuItem)
    .delete(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), checkBillingModule('menuManagement'), deleteMenuItem);

export default router;
