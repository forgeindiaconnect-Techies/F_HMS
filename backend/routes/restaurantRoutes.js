import express from 'express';
import { getRestaurants, createRestaurant, getBranches, createBranch, getMyRestaurant, updateMyRestaurant, updateSubscription } from '../controllers/restaurantController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/mine')
    .get(protect, getMyRestaurant)
    .put(protect, authorize('RestaurantAdmin'), updateMyRestaurant);

router.route('/')
    .get(protect, authorize('SuperAdmin'), getRestaurants)
    .post(protect, authorize('SuperAdmin'), createRestaurant);

router.route('/:id/subscription')
    .put(protect, authorize('SuperAdmin'), updateSubscription);

router.route('/:id/branches')
    .get(getBranches)
    .post(protect, authorize('RestaurantAdmin'), createBranch);

export default router;
