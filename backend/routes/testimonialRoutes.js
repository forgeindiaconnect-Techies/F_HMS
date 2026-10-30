import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getPublicTestimonials,
    getMyTestimonial,
    saveMyTestimonial,
    getAdminTestimonials,
    updateTestimonialStatus,
    deleteTestimonial,
    testimonialUpload
} from '../controllers/testimonialController.js';

const router = express.Router();

// ── Public Endpoint (for Restaurant Landing Page) ─────────────
router.get('/public', getPublicTestimonials);

// ── Restaurant Owner Endpoints ───────────────────────────────
router.get('/mine', protect, getMyTestimonial);
router.post('/mine', protect, testimonialUpload, saveMyTestimonial);

// ── Admin / SuperAdmin Moderation Endpoints ──────────────────
router.get('/admin/all', protect, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin'), getAdminTestimonials);
router.put('/admin/:id/status', protect, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin'), updateTestimonialStatus);
router.delete('/admin/:id', protect, authorize('SuperAdmin'), deleteTestimonial);

export default router;
