import express from 'express';
import { createServiceRequest, getActiveServiceRequests, completeServiceRequest } from '../controllers/serviceRequestController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(optionalProtect, createServiceRequest)
    .get(protect, getActiveServiceRequests);

router.route('/:id/complete')
    .put(protect, completeServiceRequest);

export default router;
