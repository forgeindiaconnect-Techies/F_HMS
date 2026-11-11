import express from 'express';
import { createServiceRequest, getActiveServiceRequests, completeServiceRequest } from '../controllers/serviceRequestController.js';
import { protect, optionalProtect, authorize, checkSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(optionalProtect, createServiceRequest)
    .get(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager', 'Waiter', 'Cashier'), getActiveServiceRequests);

router.route('/:id/complete')
    .put(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager', 'Waiter', 'Cashier'), completeServiceRequest);

export default router;
