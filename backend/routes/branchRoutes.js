import express from 'express';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../controllers/branchController.js';
import { protect, authorize, checkSubscription, checkFeature } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply middleware to all routes in this file
router.use(protect);
router.use(checkSubscription);

router.route('/')
    .get(authorize('RestaurantAdmin', 'SuperAdmin', 'BranchManager', 'Waiter', 'Cashier'), getBranches)
    .post(authorize('RestaurantAdmin', 'SuperAdmin'), checkFeature('Multi Branch'), createBranch);

router.route('/:id')
    .put(authorize('RestaurantAdmin', 'SuperAdmin'), checkFeature('Multi Branch'), updateBranch)
    .delete(authorize('RestaurantAdmin', 'SuperAdmin'), checkFeature('Multi Branch'), deleteBranch);

export default router;
