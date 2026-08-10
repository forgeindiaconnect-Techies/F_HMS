import express from 'express';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplierController.js';
import { protect, authorize, checkSubscription, checkFeature } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('RestaurantAdmin', 'BranchManager'));
router.use(checkSubscription);
router.use(checkFeature('Vendor Management'));

router.route('/')
    .get(getSuppliers)
    .post(createSupplier);

router.route('/:id')
    .put(updateSupplier)
    .delete(deleteSupplier);

export default router;
