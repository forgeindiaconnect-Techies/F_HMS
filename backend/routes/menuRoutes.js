import express from 'express';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menuController.js';
import { protect, optionalProtect, checkBillingModule } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(optionalProtect, getMenuItems)
    .post(protect, checkBillingModule('menuManagement'), createMenuItem);

router.route('/:id')
    .put(protect, checkBillingModule('menuManagement'), updateMenuItem)
    .delete(protect, checkBillingModule('menuManagement'), deleteMenuItem);

export default router;
