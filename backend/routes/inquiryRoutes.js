import express from 'express';
import {
    createInquiry,
    getInquiries,
    getRestaurantInquiries,
    getMyCustomerInquiries,
    updateInquiryStatus,
    updateRestaurantInquiryStatus,
    deleteInquiry
} from '../controllers/inquiryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to submit inquiry
router.route('/').post(createInquiry);

// Authenticated customer's own inquiries
router.route('/mine').get(protect, getMyCustomerInquiries);

// Protected routes for RestaurantAdmin / Admin / BranchManager / SuperAdmin
router.route('/restaurant')
    .get(protect, authorize('RestaurantAdmin', 'Admin', 'BranchManager', 'SuperAdmin'), getRestaurantInquiries);

router.route('/restaurant/:id')
    .put(protect, authorize('RestaurantAdmin', 'Admin', 'BranchManager', 'SuperAdmin'), updateRestaurantInquiryStatus);

// Protected routes for SuperAdmin only
router.route('/admin')
    .get(protect, authorize('SuperAdmin'), getInquiries);

router.route('/admin/:id')
    .put(protect, authorize('SuperAdmin'), updateInquiryStatus)
    .delete(protect, authorize('SuperAdmin'), deleteInquiry);

export default router;

