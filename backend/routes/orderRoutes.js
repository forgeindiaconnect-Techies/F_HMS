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
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/razorpay-order').post(createRazorpayCustomerOrder);
router.route('/razorpay-verify').post(verifyRazorpayCustomerPayment);

router.route('/')
    .post(optionalProtect, addOrderItems)
    .get(protect, getOrders);

router.route('/myorders').get(protect, getMyOrders);

router.route('/:id').get(optionalProtect, getOrderById);

router.route('/:id/items').put(optionalProtect, appendOrderItems);

router.route('/:id/pay').put(optionalProtect, updateOrderToPaid);

router.route('/:id/status').put(protect, updateOrderStatus);

router.route('/:id/location').put(protect, updateDeliveryLocation);

router.route('/merge').post(protect, mergeOrders);
router.route('/:id/refund').put(protect, refundOrder);

export default router;
