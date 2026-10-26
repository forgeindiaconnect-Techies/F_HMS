import mongoose from 'mongoose';
import Expense from '../models/Expense.js';
import Branch from '../models/Branch.js';

import Restaurant from '../models/Restaurant.js';

// Helper to resolve user's restaurantId safely
const getUserRestaurantId = async (user, queryOrBody = {}) => {
    let rId = user?.restaurantId || user?.restaurant;
    if (!rId && user?.branchId) {
        const branchDoc = await Branch.findById(user.branchId);
        if (branchDoc) rId = branchDoc.restaurantId;
    }
    if (!rId && queryOrBody?.restaurantId) {
        rId = queryOrBody.restaurantId;
    }
    if (!rId && user?.role === 'SuperAdmin') {
        const firstRest = await Restaurant.findOne().select('_id');
        if (firstRest) rId = firstRest._id;
    }
    return rId;
};

// Helper for date boundaries
const parseDateRange = (period, startDate, endDate) => {
    const now = new Date();
    let start = null;
    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (period === 'today') {
        start = new Date();
        start.setHours(0, 0, 0, 0);
    } else if (period === 'yesterday') {
        start = new Date();
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
    } else if (period === 'last7days' || period === 'weekly') {
        start = new Date();
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
    } else if (period === 'last30days') {
        start = new Date();
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
    } else if (period === 'thismonth' || period === 'monthly') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
    } else if (period === 'lastmonth') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (startDate || endDate) {
        if (startDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
        }
        if (endDate) {
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        }
    }

    return { start, end };
};

// @desc    Get all expenses with comprehensive filters
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user, req.query);
        const filter = { restaurantId };
        
        // Scope by branch for BranchManager or specific query
        if (req.user && req.user.role === 'BranchManager' && req.user.branchId) {
            filter.branchId = req.user.branchId;
        } else if (req.query.branchId && req.query.branchId !== 'All') {
            filter.branchId = req.query.branchId;
        }

        // Category filter
        if (req.query.category && req.query.category !== 'All') {
            filter.category = req.query.category;
        }

        // Payment status filter
        if (req.query.paymentStatus && req.query.paymentStatus !== 'All') {
            filter.paymentStatus = req.query.paymentStatus;
        }

        // Date range filtering
        const { start, end } = parseDateRange(req.query.period, req.query.startDate, req.query.endDate);
        if (start || end) {
            filter.date = {};
            if (start) filter.date.$gte = start;
            if (end) filter.date.$lte = end;
        }

        // Search query
        if (req.query.search) {
            const query = req.query.search.trim();
            filter.$or = [
                { description: { $regex: query, $options: 'i' } },
                { billingPeriod: { $regex: query, $options: 'i' } },
                { staff: { $regex: query, $options: 'i' } }
            ];
        }

        const expenses = await Expense.find(filter)
            .populate('branchId', 'name')
            .populate('createdBy', 'name role')
            .populate('payments.recordedBy', 'name role')
            .sort({ date: -1, createdAt: -1 });

        // Dynamically compute Overdue status for pending bills past due date
        const now = new Date();
        const enrichedExpenses = expenses.map(exp => {
            const doc = exp.toObject();
            if (doc.paymentStatus === 'Pending' && doc.dueDate && new Date(doc.dueDate) < now) {
                doc.isOverdue = true;
            }
            return doc;
        });

        res.json(enrichedExpenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get aggregated expense summaries (paid, pending, upcoming, overdue, category breakdown)
// @route   GET /api/expenses/summary
// @access  Private
export const getExpenseSummary = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user, req.query);
        const matchFilter = { restaurantId: new mongoose.Types.ObjectId(restaurantId) };

        if (req.user && req.user.role === 'BranchManager' && req.user.branchId) {
            matchFilter.branchId = new mongoose.Types.ObjectId(req.user.branchId);
        } else if (req.query.branchId && req.query.branchId !== 'All') {
            matchFilter.branchId = new mongoose.Types.ObjectId(req.query.branchId);
        }

        const { start, end } = parseDateRange(req.query.period, req.query.startDate, req.query.endDate);
        if (start || end) {
            matchFilter.date = {};
            if (start) matchFilter.date.$gte = start;
            if (end) matchFilter.date.$lte = end;
        }

        const expenses = await Expense.find(matchFilter);
        const now = new Date();
        const next15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

        let totalIncurred = 0;
        let totalPaid = 0;
        let totalOutstanding = 0;
        let overdueCount = 0;
        let overdueAmount = 0;
        let upcomingCount = 0;
        let upcomingAmount = 0;
        const categoryMap = {};

        for (const exp of expenses) {
            const amount = Number(exp.amount) || 0;
            const paid = Number(exp.paidAmount) || 0;
            const balance = Math.max(0, amount - paid);

            totalIncurred += amount;
            totalPaid += paid;
            totalOutstanding += balance;

            // Category breakdown
            const cat = exp.category || 'Others';
            categoryMap[cat] = (categoryMap[cat] || 0) + amount;

            // Overdue check
            if (balance > 0 && exp.dueDate && new Date(exp.dueDate) < now) {
                overdueCount++;
                overdueAmount += balance;
            }

            // Upcoming check (due in next 15 days)
            if (balance > 0 && exp.dueDate && new Date(exp.dueDate) >= now && new Date(exp.dueDate) <= next15Days) {
                upcomingCount++;
                upcomingAmount += balance;
            }
        }

        const categoryBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
            category,
            amount: Math.round(amount * 100) / 100,
            percentage: totalIncurred > 0 ? Math.round((amount / totalIncurred) * 100) : 0
        })).sort((a, b) => b.amount - a.amount);

        res.json({
            totalIncurred: Math.round(totalIncurred * 100) / 100,
            totalPaid: Math.round(totalPaid * 100) / 100,
            totalOutstanding: Math.round(totalOutstanding * 100) / 100,
            outstandingLiabilities: Math.round(totalOutstanding * 100) / 100,
            overdueCount,
            overdueBillsCount: overdueCount,
            overdueAmount: Math.round(overdueAmount * 100) / 100,
            upcomingCount,
            upcomingAmount: Math.round(upcomingAmount * 100) / 100,
            categoryBreakdown
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new expense record / recurring bill
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
    const { 
        title, category, amount, description, date, dueDate, billingPeriod,
        paymentStatus, paidAmount, paymentMethod, paymentDate,
        isRecurring, recurringFrequency, recurringKey,
        receiptUrl, notes, staff, branchId 
    } = req.body;

    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const targetBranchId = branchId || req.user.branchId;

        const amt = Number(amount) || 0;
        const finalTitle = (title || description || `${category} Expense`).trim();
        const finalDescription = (description || title || finalTitle).trim();

        const initialStatus = paymentStatus || (Number(paidAmount) >= amt ? 'Paid' : (Number(paidAmount) > 0 ? 'Partially Paid' : 'Pending'));
        let initialPaid = 0;

        if (initialStatus === 'Paid') {
            initialPaid = amt;
        } else if (initialStatus === 'Partially Paid') {
            initialPaid = Number(paidAmount) || 0;
        }

        const initialBalance = Math.max(0, amt - initialPaid);

        // If recurring key given, check for duplicate billing period to prevent duplicate bills
        if (recurringKey) {
            const exists = await Expense.findOne({ restaurantId, recurringKey });
            if (exists) {
                return res.status(400).json({ message: `A recurring bill for this cycle (${recurringKey}) already exists.` });
            }
        }

        const expenseDate = date ? new Date(date) : new Date();

        const expense = await Expense.create({
            title: finalTitle,
            category,
            amount: amt,
            description: finalDescription,
            date: expenseDate,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            billingPeriod: billingPeriod || expenseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            paymentStatus: initialStatus,
            paidAmount: initialPaid,
            balanceDue: initialBalance,
            paymentMethod: paymentMethod || 'Cash',
            paymentDate: initialPaid > 0 ? (paymentDate ? new Date(paymentDate) : expenseDate) : undefined,
            payments: initialPaid > 0 ? [{
                amount: initialPaid,
                paidDate: paymentDate ? new Date(paymentDate) : expenseDate,
                paymentMethod: paymentMethod || 'Cash',
                reference: 'Initial Payment',
                notes: notes || '',
                recordedBy: req.user._id
            }] : [],
            isRecurring: Boolean(isRecurring),
            recurringFrequency: isRecurring ? (recurringFrequency || 'Monthly') : undefined,
            recurringKey: isRecurring ? (recurringKey || `${category.toLowerCase().replace(/\s+/g, '_')}_${targetBranchId || 'main'}_${expenseDate.toISOString().slice(0, 7)}`) : undefined,
            receiptUrl: receiptUrl || '',
            notes: notes || '',
            staff: staff || req.user.name || 'Staff',
            restaurantId,
            branchId: targetBranchId,
            source: 'Manual',
            createdBy: req.user._id
        });

        const populated = await Expense.findById(expense._id).populate('branchId', 'name');
        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update existing expense record
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense record not found' });
        }

        if (expense.restaurantId.toString() !== restaurantId.toString()) {
            return res.status(403).json({ message: 'Not authorized to modify this record' });
        }

        const {
            title, category, amount, description, date, dueDate, billingPeriod,
            paymentStatus, paidAmount, paymentMethod, isRecurring, recurringFrequency,
            notes, branchId
        } = req.body;

        if (title !== undefined) expense.title = title.trim();
        if (description !== undefined) expense.description = description.trim();
        if (category !== undefined) expense.category = category;
        if (amount !== undefined) {
            expense.amount = Number(amount) || 0;
        }
        if (paidAmount !== undefined) {
            expense.paidAmount = Number(paidAmount) || 0;
        }
        expense.balanceDue = Math.max(0, (expense.amount || 0) - (expense.paidAmount || 0));

        if (paymentStatus !== undefined) {
            expense.paymentStatus = paymentStatus;
        } else {
            expense.paymentStatus = expense.paidAmount >= expense.amount ? 'Paid' : (expense.paidAmount > 0 ? 'Partially Paid' : 'Pending');
        }

        if (date !== undefined) expense.date = new Date(date);
        if (dueDate !== undefined) expense.dueDate = dueDate ? new Date(dueDate) : undefined;
        if (billingPeriod !== undefined) expense.billingPeriod = billingPeriod;
        if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
        if (notes !== undefined) expense.notes = notes;
        if (isRecurring !== undefined) expense.isRecurring = Boolean(isRecurring);
        if (recurringFrequency !== undefined) expense.recurringFrequency = recurringFrequency;
        if (branchId !== undefined) expense.branchId = branchId || undefined;

        await expense.save();

        const populated = await Expense.findById(expense._id)
            .populate('branchId', 'name')
            .populate('createdBy', 'name role')
            .populate('payments.recordedBy', 'name role');

        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Record partial or full payment on an expense / bill
// @route   POST /api/expenses/:id/pay
// @access  Private
export const recordExpensePayment = async (req, res) => {
    const { amount, paymentMethod, reference, notes, paidDate } = req.body;

    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense record not found' });
        }

        if (expense.restaurantId.toString() !== restaurantId.toString()) {
            return res.status(403).json({ message: 'Not authorized to modify this record' });
        }

        const payAmt = Number(amount);
        if (!payAmt || payAmt <= 0) {
            return res.status(400).json({ message: 'Valid payment amount is required' });
        }

        const newPaid = Math.min(expense.amount, (expense.paidAmount || 0) + payAmt);
        const newBalance = Math.max(0, expense.amount - newPaid);
        const newStatus = newPaid >= expense.amount ? 'Paid' : (newPaid > 0 ? 'Partially Paid' : 'Pending');

        const paymentTimestamp = paidDate ? new Date(paidDate) : new Date();

        expense.paidAmount = newPaid;
        expense.balanceDue = newBalance;
        expense.paymentStatus = newStatus;
        expense.paymentDate = paymentTimestamp;
        expense.paymentMethod = paymentMethod || expense.paymentMethod || 'Cash';
        expense.payments.push({
            amount: payAmt,
            paidDate: paymentTimestamp,
            paymentMethod: paymentMethod || 'Cash',
            reference: reference || '',
            notes: notes || '',
            recordedBy: req.user._id
        });

        await expense.save();

        const populated = await Expense.findById(expense._id)
            .populate('branchId', 'name')
            .populate('payments.recordedBy', 'name');

        res.json({ message: 'Payment recorded successfully', expense: populated });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Generate upcoming recurring monthly bills without duplicating
// @route   POST /api/expenses/generate-recurring
// @access  Private
export const generateRecurringBills = async (req, res) => {
    const { billingMonth, billingYear, targetBillingPeriod, branchId } = req.body;

    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const now = new Date();
        const m = billingMonth !== undefined ? parseInt(billingMonth) : now.getMonth() + 1;
        const y = billingYear !== undefined ? parseInt(billingYear) : now.getFullYear();
        const periodKey = `${y}-${m.toString().padStart(2, '0')}`;
        const periodLabel = targetBillingPeriod || new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Find all recurring template expenses in this restaurant
        const filter = { restaurantId, isRecurring: true };
        if (branchId && branchId !== 'All') {
            filter.branchId = branchId;
        }

        let recurringTemplates = await Expense.find(filter);

        // If no recurring bills configured yet, instantiate standard default recurring utility bills!
        if (!recurringTemplates.length) {
            const defaultTemplates = [
                { category: 'Rent', title: 'Monthly Premises Rent', amount: 25000, description: `Premises Rent - ${periodLabel}` },
                { category: 'Electricity', title: 'Electricity & Power Utility', amount: 6500, description: `Electricity Bill - ${periodLabel}` },
                { category: 'Internet', title: 'High-Speed Broadband Internet', amount: 1500, description: `Broadband Internet Bill - ${periodLabel}` },
                { category: 'Water', title: 'Commercial Water Utility', amount: 1200, description: `Commercial Water Bill - ${periodLabel}` }
            ];

            const createdDefaults = [];
            const billDueDate = new Date(y, m - 1, 10, 23, 59, 59);

            for (const dt of defaultTemplates) {
                const cycleKey = `${dt.category.toLowerCase()}_${branchId || 'main'}_${periodKey}`;
                const bill = await Expense.create({
                    category: dt.category,
                    title: dt.title,
                    description: dt.description,
                    amount: dt.amount,
                    date: new Date(y, m - 1, 1),
                    dueDate: billDueDate,
                    billingPeriod: periodLabel,
                    paymentStatus: 'Pending',
                    paidAmount: 0,
                    balanceDue: dt.amount,
                    paymentMethod: 'Bank Transfer',
                    isRecurring: true,
                    recurringFrequency: 'Monthly',
                    recurringKey: cycleKey,
                    notes: `Recurring standard monthly bill for ${periodLabel}`,
                    staff: req.user.name || 'Admin',
                    restaurantId,
                    branchId: branchId && branchId !== 'All' ? branchId : req.user.branchId,
                    source: 'Recurring',
                    createdBy: req.user._id
                });
                createdDefaults.push(bill);
            }

            return res.json({
                message: `Generated ${createdDefaults.length} recurring utility & rent bills for ${periodLabel}`,
                createdCount: createdDefaults.length,
                bills: createdDefaults
            });
        }

        // Deduplicate templates by category + branchId
        const templatesByKey = {};
        for (const t of recurringTemplates) {
            const key = `${t.category}_${t.branchId || 'main'}`;
            if (!templatesByKey[key]) templatesByKey[key] = t;
        }

        const generated = [];
        for (const [key, tmpl] of Object.entries(templatesByKey)) {
            const cycleKey = `${key}_${periodKey}`;
            const alreadyExists = await Expense.findOne({ restaurantId, recurringKey: cycleKey });

            if (!alreadyExists) {
                // Due on 10th of that billing month
                const billDueDate = new Date(y, m - 1, 10, 23, 59, 59);

                const newBill = await Expense.create({
                    category: tmpl.category,
                    title: tmpl.title || `${tmpl.category} Bill`,
                    amount: tmpl.amount,
                    description: `${tmpl.title || tmpl.category} - ${periodLabel}`,
                    date: new Date(y, m - 1, 1),
                    dueDate: billDueDate,
                    billingPeriod: periodLabel,
                    paymentStatus: 'Pending',
                    paidAmount: 0,
                    balanceDue: tmpl.amount,
                    paymentMethod: tmpl.paymentMethod || 'Bank Transfer',
                    isRecurring: true,
                    recurringFrequency: tmpl.recurringFrequency || 'Monthly',
                    recurringKey: cycleKey,
                    notes: `Auto-generated recurring monthly bill for ${periodLabel}`,
                    staff: req.user.name || 'Admin',
                    restaurantId,
                    branchId: tmpl.branchId,
                    source: 'Recurring',
                    createdBy: req.user._id
                });
                generated.push(newBill);
            }
        }

        res.json({
            message: generated.length > 0 
                ? `Generated ${generated.length} recurring bills for ${periodLabel}`
                : `All recurring bills for ${periodLabel} are already up to date.`,
            createdCount: generated.length,
            bills: generated
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const expense = await Expense.findById(req.params.id);

        if (expense) {
            if (expense.restaurantId.toString() !== restaurantId.toString()) {
                return res.status(403).json({ message: 'Not authorized to delete this expense' });
            }
            await expense.deleteOne();
            res.json({ message: 'Expense record deleted' });
        } else {
            res.status(404).json({ message: 'Expense record not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
