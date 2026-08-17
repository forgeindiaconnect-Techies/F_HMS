import Expense from '../models/Expense.js';

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
    try {
        const filter = {};
        if (req.user && req.user.branchId) {
            filter.branchId = req.user.branchId;
        } else if (req.user && req.user.restaurantId) {
            filter.restaurantId = req.user.restaurantId;
        } else if (req.user && req.user.role !== 'SuperAdmin') {
            return res.json([]);
        }

        const expenses = await Expense.find(filter).sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
    const { category, amount, description, date, staff } = req.body;

    try {
        const expense = await Expense.create({
            category,
            amount,
            description,
            date,
            staff,
            restaurantId: req.user.restaurantId,
            branchId: req.user.branchId
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (expense) {
            await expense.deleteOne();
            res.json({ message: 'Expense record deleted' });
        } else {
            res.status(404).json({ message: 'Expense record not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
