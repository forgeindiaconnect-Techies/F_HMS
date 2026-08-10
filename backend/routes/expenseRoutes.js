import express from 'express';
import { getExpenses, createExpense, deleteExpense } from '../controllers/expenseController.js';
import { protect, authorize, checkSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('RestaurantAdmin', 'BranchManager'));
router.use(checkSubscription);

router.route('/')
    .get(getExpenses)
    .post(createExpense);

router.route('/:id')
    .delete(deleteExpense);

export default router;
