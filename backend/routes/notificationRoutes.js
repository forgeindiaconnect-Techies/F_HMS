import express from 'express';
import { 
    getNotifications, 
    createBroadcast, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications, 
    requestRestock, 
    orderRestockFromNotification 
} from '../controllers/notificationController.js';
import { protect, authorize, checkSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('RestaurantAdmin', 'Admin', 'BranchManager', 'Chef', 'Staff', 'Waiter', 'Cashier', 'SuperAdmin'));
router.use(checkSubscription);

router.route('/')
    .get(getNotifications);

router.route('/broadcast')
    .post(authorize('RestaurantAdmin', 'Admin', 'BranchManager'), createBroadcast);

router.route('/restock')
    .post(requestRestock);

router.route('/:id/order-restock')
    .post(authorize('RestaurantAdmin', 'Admin', 'BranchManager'), orderRestockFromNotification);

router.route('/read-all')
    .put(markAllAsRead);

router.route('/clear-all')
    .delete(clearAllNotifications);

router.route('/:id/read')
    .put(markAsRead);

router.route('/:id')
    .delete(deleteNotification);

export default router;
