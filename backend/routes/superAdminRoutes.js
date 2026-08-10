import express from 'express';
import { 
    getStats, getRestaurants, updateSubscription, deleteRestaurant, 
    getSuperAdminNotifications, markSuperAdminNotificationAsRead, 
    getPlans, createPlan, updatePlan, deletePlan, getTickets, 
    updateTicket, updateApprovalStatus, getAllUsers, updateUserStatus, deleteUser,
    broadcastNotification, deleteSuperAdminNotification,
    getSubscriptionPayments, getSubscriptionAnalytics
} from '../controllers/superAdminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('SuperAdmin'));

router.route('/stats').get(getStats);
router.route('/restaurants').get(getRestaurants);
router.route('/restaurants/:id').delete(deleteRestaurant);
router.route('/restaurants/:id/subscription').put(updateSubscription);
router.route('/restaurants/:id/approval').put(updateApprovalStatus);

router.route('/notifications').get(getSuperAdminNotifications);
router.route('/notifications/broadcast').post(broadcastNotification);
router.route('/notifications/:id').delete(deleteSuperAdminNotification);
router.route('/notifications/:id/read').put(markSuperAdminNotificationAsRead);

router.route('/users')
    .get(getAllUsers);
router.route('/users/:id')
    .delete(deleteUser);
router.route('/users/:id/status')
    .put(updateUserStatus);

router.route('/plans')
    .get(getPlans)
    .post(createPlan);
router.route('/plans/:id')
    .put(updatePlan)
    .delete(deletePlan);

router.route('/tickets')
    .get(getTickets);
router.route('/tickets/:id')
    .put(updateTicket);

router.route('/billing-history')
    .get(getSubscriptionPayments);

router.route('/subscription-analytics')
    .get(getSubscriptionAnalytics);

export default router;
