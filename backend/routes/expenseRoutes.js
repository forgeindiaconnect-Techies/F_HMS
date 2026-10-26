import express from 'express';
import { 
    getExpenses, 
    getExpenseSummary, 
    createExpense, 
    updateExpense,
    recordExpensePayment, 
    generateRecurringBills, 
    deleteExpense 
} from '../controllers/expenseController.js';
import { protect, authorize, checkSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('RestaurantAdmin', 'BranchManager'));
router.use(checkSubscription);

// Financial summaries & actions
router.get('/summary', getExpenseSummary);
router.post('/generate-recurring', generateRecurringBills);
router.post('/recurring/generate', generateRecurringBills);
router.post('/:id/pay', recordExpensePayment);

router.route('/')
    .get(getExpenses)
    .post(createExpense);

router.route('/:id')
    .put(updateExpense)
    .delete(deleteExpense);

export default router;
