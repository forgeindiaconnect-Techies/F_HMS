import express from 'express';
import {
    createBillingDemoRequest,
    getBillingDemoRequests,
    getBillingDemoRequestById,
    updateBillingDemoStatus,
    updateBillingDemoConfig,
    activateBillingDemo,
    deleteBillingDemoRequest
} from '../controllers/billingDemoController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to book demo walkthrough
router.route('/')
    .post(createBillingDemoRequest);

// Super Admin protected management routes
router.route('/admin')
    .get(protect, authorize('SuperAdmin'), getBillingDemoRequests);

router.route('/admin/:id')
    .get(protect, authorize('SuperAdmin'), getBillingDemoRequestById)
    .delete(protect, authorize('SuperAdmin'), deleteBillingDemoRequest);

router.route('/admin/:id/status')
    .put(protect, authorize('SuperAdmin'), updateBillingDemoStatus);

router.route('/admin/:id/config')
    .put(protect, authorize('SuperAdmin'), updateBillingDemoConfig);

router.route('/admin/:id/activate')
    .post(protect, authorize('SuperAdmin'), activateBillingDemo);

export default router;
