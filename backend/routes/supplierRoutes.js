import express from 'express';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplierController.js';
import { protect, authorize, checkSubscription, checkFeature } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('RestaurantAdmin', 'BranchManager'));
router.use(checkSubscription);

router.route('/')
    .get(getSuppliers)
    .post(checkFeature('Vendor Management'), createSupplier);

router.route('/:id')
    .put(checkFeature('Vendor Management'), updateSupplier)
    .delete(checkFeature('Vendor Management'), deleteSupplier);

export default router;
