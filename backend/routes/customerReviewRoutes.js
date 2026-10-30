import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getPublicCustomerReviews,
    getMyCustomerReviews,
    submitCustomerReview,
    deleteCustomerReview
} from '../controllers/customerReviewController.js';

const router = express.Router();

// Public endpoint for customer landing page
router.get('/public', getPublicCustomerReviews);

// Customer endpoints
router.get('/mine', protect, getMyCustomerReviews);
router.post('/', protect, submitCustomerReview);
router.delete('/:id', protect, deleteCustomerReview);

export default router;
