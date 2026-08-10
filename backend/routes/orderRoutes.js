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
    refundOrder
} from '../controllers/orderController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(optionalProtect, addOrderItems)
    .get(protect, getOrders);

router.route('/myorders').get(protect, getMyOrders);

router.route('/:id').get(optionalProtect, getOrderById);

router.route('/:id/items').put(optionalProtect, appendOrderItems);

router.route('/:id/pay').put(protect, updateOrderToPaid);

router.route('/:id/status').put(protect, updateOrderStatus);

router.route('/merge').post(protect, mergeOrders);
router.route('/:id/refund').put(protect, refundOrder);

export default router;
