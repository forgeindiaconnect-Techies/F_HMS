import express from 'express';
import { getPublicPlans, scanActivateSubscription } from '../controllers/planController.js';

const router = express.Router();

router.route('/')
    .get(getPublicPlans);

router.route('/scan-activate')
    .get(scanActivateSubscription);

export default router;
