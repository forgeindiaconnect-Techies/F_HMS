import Expense from '../models/Expense.js';

// @desc    Get all expenses with branch & date filtering
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
    try {
        const filter = {};
        
        // Scope by branch for BranchManager, or by restaurant for RestaurantAdmin
        if (req.user && req.user.branchId) {
            filter.branchId = req.user.branchId;
        } else if (req.user && req.user.restaurantId) {
            filter.restaurantId = req.user.restaurantId;
            // Admin can pass specific branchId query param
            if (req.query.branchId && req.query.branchId !== 'All') {
                filter.branchId = req.query.branchId;
            }
        } else if (req.user && req.user.role !== 'SuperAdmin') {
            return res.json([]);
        }

        // Date period filtering
        const { period } = req.query;
        if (period) {
            const now = new Date();
            let startDate = new Date();

            if (period === 'today') {
                startDate.setHours(0, 0, 0, 0);
                filter.date = { $gte: startDate };
            } else if (period === 'weekly') {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                startDate = new Date(now.setDate(diff));
                startDate.setHours(0, 0, 0, 0);
                filter.date = { $gte: startDate };
            } else if (period === 'monthly') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                filter.date = { $gte: startDate };
            }
        }

        const expenses = await Expense.find(filter)
            .populate('branchId', 'name')
            .sort({ date: -1 });

        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
    const { category, amount, description, date, staff, branchId } = req.body;

    try {
        const targetBranchId = branchId || req.user.branchId;

        const expense = await Expense.create({
            category,
            amount,
            description,
            date: date || new Date(),
            staff: staff || req.user.name || 'Staff',
            restaurantId: req.user.restaurantId,
            branchId: targetBranchId
        });

        const populated = await Expense.findById(expense._id).populate('branchId', 'name');
        res.status(201).json(populated);
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
