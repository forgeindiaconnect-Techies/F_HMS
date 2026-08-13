import express from 'express';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../controllers/branchController.js';
import { protect, authorize, checkSubscription, checkFeature } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply middleware to all routes in this file
router.use(protect);
router.use(checkSubscription);

router.route('/')
    .get(authorize('RestaurantAdmin', 'SuperAdmin', 'BranchManager', 'Waiter', 'Cashier'), getBranches)
    .post(authorize('RestaurantAdmin', 'SuperAdmin'), createBranch);

router.route('/:id')
    .put(authorize('RestaurantAdmin', 'SuperAdmin'), updateBranch)
    .delete(authorize('RestaurantAdmin', 'SuperAdmin'), deleteBranch);

export default router;
