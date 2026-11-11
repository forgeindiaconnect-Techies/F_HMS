import express from 'express';
import { getNotifications, createBroadcast, markAsRead, markAllAsRead, requestRestock, orderRestockFromNotification } from '../controllers/notificationController.js';
import { protect, authorize, checkSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('RestaurantAdmin', 'BranchManager', 'Chef', 'Staff')); // Wait, chefs/staff need access to post restock requests
router.use(checkSubscription);

router.route('/')
    .get(getNotifications);

router.route('/broadcast')
    .post(authorize('RestaurantAdmin', 'BranchManager'), createBroadcast);

router.route('/restock')
    .post(requestRestock);

router.route('/:id/order-restock')
    .post(authorize('RestaurantAdmin', 'BranchManager'), orderRestockFromNotification);

router.route('/read-all')
    .put(markAllAsRead);

router.route('/:id/read')
    .put(markAsRead);

export default router;
