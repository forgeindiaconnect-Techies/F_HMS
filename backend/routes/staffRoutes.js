import express from 'express';
import { getStaff, createStaff, deleteStaff, updateStaff } from '../controllers/staffController.js';
import { protect, authorize, checkSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(checkSubscription);

router.route('/')
    .get(authorize('RestaurantAdmin', 'BranchManager'), getStaff)
    .post(authorize('RestaurantAdmin'), createStaff);

router.route('/:id')
    .put(authorize('RestaurantAdmin'), updateStaff)
    .delete(authorize('RestaurantAdmin'), deleteStaff);

export default router;
