import express from 'express';
import { getCustomers, createCustomer } from '../controllers/customerController.js';
import { protect, authorize, checkSubscription, checkBillingModule } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('RestaurantAdmin', 'BranchManager'));
router.use(checkSubscription);
router.use(checkBillingModule('customerManagement'));

router.route('/')
    .get(getCustomers)
    .post(createCustomer);

export default router;
