import express from 'express';
import { 
    getInventory, 
    createInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem, 
    logWastage,
    recordMaterialPurchase,
    getMaterialPurchases,
    recordMaterialPurchasePayment,
    getStockMovements,
    recordStockAdjustment,
    getInventoryValuation
} from '../controllers/inventoryController.js';
import { protect, authorize, checkSubscription, checkBillingModule } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('RestaurantAdmin', 'BranchManager', 'Chef', 'Staff'));
router.use(checkSubscription);
router.use(checkBillingModule('inventoryManagement'));

// Material Purchases & Invoices
router.get('/purchases', getMaterialPurchases);
router.post('/purchases', recordMaterialPurchase);
router.post('/purchases/:id/pay', recordMaterialPurchasePayment);

// Stock Movements & Adjustments
router.get('/stock-movements', getStockMovements);
router.post('/stock-adjustments', recordStockAdjustment);
router.get('/valuation', getInventoryValuation);

// Wastage Logging
router.post('/wastage', logWastage);

// Core Inventory Items CRUD
router.route('/')
    .get(getInventory)
    .post(createInventoryItem);

router.route('/:id')
    .put(updateInventoryItem)
    .delete(deleteInventoryItem);

export default router;
