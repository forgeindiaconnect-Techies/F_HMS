import express from 'express';
import { createInquiry, getInquiries, updateInquiryStatus, deleteInquiry } from '../controllers/inquiryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to submit inquiry
router.route('/').post(createInquiry);

// Protected routes for SuperAdmin only
router.route('/admin')
    .get(protect, authorize('SuperAdmin'), getInquiries);

router.route('/admin/:id')
    .put(protect, authorize('SuperAdmin'), updateInquiryStatus)
    .delete(protect, authorize('SuperAdmin'), deleteInquiry);

export default router;

