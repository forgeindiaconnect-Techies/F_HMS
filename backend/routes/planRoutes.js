import express from 'express';
import { getPublicPlans, handleRazorpayWebhook } from '../controllers/planController.js';

const router = express.Router();

router.route('/')
    .get(getPublicPlans);

router.route('/webhook')
    .post(handleRazorpayWebhook);

export default router;
