import express from 'express';
import {
    sendOtp, verifyOtp, getDeliveryProfile, togglePartnerStatus,
    getAssignedOrders, updateOrderDeliveryStatus, createWithdrawalRequest,
    getWithdrawalRequests, getEarningsHistory, getDeliveryPartners,
    addDeliveryPartner, updatePartnerVerificationStatus, assignDeliveryPartner,
    autoAssignDeliveryPartner, getDeliveryAnalytics, submitDeliveryRating,
    updateDeliverySettings, togglePartnerActiveStatus
} from '../controllers/deliveryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authentication Simulator
router.post('/auth/send-otp', sendOtp);
router.post('/auth/verify-otp', verifyOtp);

// Partner routes
router.route('/profile')
    .get(protect, getDeliveryProfile);
router.route('/profile/status')
    .put(protect, togglePartnerStatus);

router.route('/orders/assigned')
    .get(protect, getAssignedOrders);
router.route('/orders/:id/status')
    .put(protect, updateOrderDeliveryStatus);

router.route('/withdrawals')
    .post(protect, createWithdrawalRequest)
    .get(protect, getWithdrawalRequests);

router.route('/earnings')
    .get(protect, getEarningsHistory);

// Admin / Manager routes
router.route('/partners')
    .get(protect, getDeliveryPartners)
    .post(protect, addDeliveryPartner);

router.route('/partners/:id/status')
    .put(protect, updatePartnerVerificationStatus);

router.route('/partners/:id/toggle-active')
    .put(protect, togglePartnerActiveStatus);

router.route('/orders/:id/assign')
    .put(protect, assignDeliveryPartner);

router.route('/orders/:id/auto-assign')
    .put(protect, autoAssignDeliveryPartner);

router.route('/analytics')
    .get(protect, getDeliveryAnalytics);

router.route('/settings')
    .put(protect, updateDeliverySettings);

// Customer feedback
router.route('/orders/:id/rating')
    .put(submitDeliveryRating);

export default router;
