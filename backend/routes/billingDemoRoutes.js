import express from 'express';
import {
    createBillingDemoRequest,
    getBillingDemoRequests,
    getBillingDemoRequestById,
    updateBillingDemoStatus,
    updateBillingDemoConfig,
    createCustomProposal,
    verifyDemoPayment,
    activateBillingDemo,
    resendActivationInvitation,
    activateAccountWithToken,
    deleteBillingDemoRequest
} from '../controllers/billingDemoController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to book demo walkthrough
router.route('/')
    .post(createBillingDemoRequest);

// Public route to activate account with single-use token
router.route('/activate-account')
    .post(activateAccountWithToken);

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

router.route('/admin/:id/proposal')
    .post(protect, authorize('SuperAdmin'), createCustomProposal);

router.route('/admin/:id/verify-payment')
    .post(protect, authorize('SuperAdmin'), verifyDemoPayment);

router.route('/admin/:id/activate')
    .post(protect, authorize('SuperAdmin'), activateBillingDemo);

router.route('/admin/:id/resend-invitation')
    .post(protect, authorize('SuperAdmin'), resendActivationInvitation);

export default router;
