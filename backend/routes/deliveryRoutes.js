import express from 'express';
import {
    sendOtp, verifyOtp, getDeliveryProfile, togglePartnerStatus,
    getAssignedOrders, updateOrderDeliveryStatus, createWithdrawalRequest,
    getWithdrawalRequests, getEarningsHistory, getDeliveryPartners,
    addDeliveryPartner, updatePartnerVerificationStatus, assignDeliveryPartner,
    autoAssignDeliveryPartner, getDeliveryAnalytics, submitDeliveryRating,
    updateDeliverySettings, togglePartnerActiveStatus, getDeliverySettings, addSupportMessage
} from '../controllers/deliveryController.js';
import { protect, authorize, checkSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authentication
router.post('/auth/send-otp', sendOtp);
router.post('/auth/verify-otp', verifyOtp);

// Partner routes
router.route('/profile')
    .get(protect, checkSubscription, authorize('DeliveryPartner', 'SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), getDeliveryProfile);
router.route('/profile/status')
    .put(protect, checkSubscription, authorize('DeliveryPartner', 'SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), togglePartnerStatus);

router.route('/orders/assigned')
    .get(protect, checkSubscription, authorize('DeliveryPartner', 'SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), getAssignedOrders);
router.route('/orders/:id/status')
    .put(protect, checkSubscription, authorize('DeliveryPartner', 'SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), updateOrderDeliveryStatus);
router.route('/orders/:id/support')
    .post(protect, checkSubscription, authorize('DeliveryPartner', 'SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), addSupportMessage);

router.route('/withdrawals')
    .post(protect, checkSubscription, authorize('DeliveryPartner', 'SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), createWithdrawalRequest)
    .get(protect, checkSubscription, authorize('DeliveryPartner', 'SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), getWithdrawalRequests);

router.route('/earnings')
    .get(protect, checkSubscription, authorize('DeliveryPartner', 'SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), getEarningsHistory);

// Admin / Manager routes
router.route('/partners')
    .get(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), getDeliveryPartners)
    .post(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), addDeliveryPartner);

router.route('/partners/:id/status')
    .put(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), updatePartnerVerificationStatus);

router.route('/partners/:id/toggle-active')
    .put(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), togglePartnerActiveStatus);

router.route('/orders/:id/assign')
    .put(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), assignDeliveryPartner);

router.route('/orders/:id/auto-assign')
    .put(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), autoAssignDeliveryPartner);

router.route('/analytics')
    .get(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), getDeliveryAnalytics);

router.route('/settings')
    .get(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), getDeliverySettings)
    .put(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager'), updateDeliverySettings);

// Customer feedback
router.route('/orders/:id/rating')
    .put(submitDeliveryRating);

export default router;
