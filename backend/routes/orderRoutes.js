import express from 'express';
import { 
    addOrderItems, 
    appendOrderItems,
    getOrderById, 
    updateOrderToPaid, 
    getMyOrders, 
    getOrders, 
    updateOrderStatus,
    mergeOrders,
    refundOrder,
    createRazorpayCustomerOrder,
    verifyRazorpayCustomerPayment,
    updateDeliveryLocation
} from '../controllers/orderController.js';
import { protect, optionalProtect, authorize, checkSubscription, checkBillingModule } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/razorpay-order').post(createRazorpayCustomerOrder);
router.route('/razorpay-verify').post(verifyRazorpayCustomerPayment);

router.route('/')
    .post(optionalProtect, addOrderItems)
    .get(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager', 'Chef', 'Waiter', 'Cashier'), checkBillingModule('dineInTakeawayOrders'), getOrders);

router.route('/myorders').get(protect, getMyOrders);

router.route('/merge').post(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager', 'Cashier'), mergeOrders);

router.route('/:id').get(optionalProtect, getOrderById);

router.route('/:id/items').put(optionalProtect, appendOrderItems);

router.route('/:id/pay').put(optionalProtect, updateOrderToPaid);

router.route('/:id/status').put(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager', 'Chef', 'Waiter', 'Cashier', 'DeliveryPartner'), updateOrderStatus);

router.route('/:id/location').put(protect, checkSubscription, authorize('SuperAdmin', 'DeliveryPartner', 'RestaurantAdmin', 'Admin', 'BranchManager'), updateDeliveryLocation);

router.route('/:id/refund').put(protect, checkSubscription, authorize('SuperAdmin', 'RestaurantAdmin', 'Admin', 'BranchManager', 'Cashier'), refundOrder);

export default router;
