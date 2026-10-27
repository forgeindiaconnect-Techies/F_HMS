import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import Plan from '../models/Plan.js';
import Expense from '../models/Expense.js';
import MaterialPurchase from '../models/MaterialPurchase.js';
import StockMovement from '../models/StockMovement.js';
import Attendance from '../models/Attendance.js';
import Payroll from '../models/Payroll.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';

// Helper to resolve user's restaurantId safely
const getUserRestaurantId = async (user, queryOrBody = {}) => {
    let rId = user?.restaurantId || user?.restaurant;
    if (!rId && user?.branchId) {
        const branchDoc = await Branch.findById(user.branchId);
        if (branchDoc) rId = branchDoc.restaurantId;
    }
    // Only SuperAdmin is allowed to query other restaurant's reports
    if (user?.role === 'SuperAdmin' && queryOrBody?.restaurantId) {
        rId = queryOrBody.restaurantId;
    }
    if (!rId && user?.role === 'SuperAdmin') {
        const firstRest = await Restaurant.findOne().select('_id');
        if (firstRest) rId = firstRest._id;
    }
    return rId;
};

// Date range parser
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
    } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
    }

    return { start, end };
};

// @desc    Generate report data
// @route   POST /api/reports/generate
// @access  Private
export const generateReport = async (req, res) => {
    const { 
        reportType, 
        period, 
        startDate, 
        endDate, 
        branch, 
        branchId,
        category,
        employee,
        paymentStatus,
        supplier,
        material
    } = req.body;

    try {
        const restaurantId = await getUserRestaurantId(req.user, { ...req.query, ...req.body });
        const restObjId = restaurantId ? new mongoose.Types.ObjectId(restaurantId) : null;

        if (!restObjId && req.user.role !== 'SuperAdmin') {
            return res.json({
                reportType,
                period,
                startDate,
                endDate,
                branch,
                data: [],
                generatedAt: new Date()
            });
        }

        const { start, end } = parseDateRange(period, startDate, endDate);

        // Determine effective branch
        let effectiveBranchId = null;
        if (req.user.role === 'BranchManager' && req.user.branchId) {
            effectiveBranchId = req.user.branchId;
        } else if (branchId && branchId !== 'All' && branchId !== 'All Branches') {
            effectiveBranchId = branchId;
        } else if (branch && branch !== 'All Branches' && branch !== 'All') {
            effectiveBranchId = branch;
        }

        let reportData = [];
        let summary = {};

        // 1. Daily Earnings Report
        if (reportType === 'daily_earnings' || reportType === 1) {
            const matchStage = {
                restaurantId: restObjId,
                createdAt: { $gte: start, $lte: end }
            };
            if (effectiveBranchId) matchStage.branchId = new mongoose.Types.ObjectId(effectiveBranchId);

            const dailyOrders = await Order.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        totalOrders: { $sum: 1 },
                        grossSales: { $sum: { $add: ['$totalPrice', { $ifNull: ['$discountAmount', { $ifNull: ['$discount', 0] }] }] } },
                        discounts: { $sum: { $ifNull: ['$discountAmount', { $ifNull: ['$discount', 0] }] } },
                        netSales: { 
                            $sum: { 
                                $cond: [{ $eq: ['$status', 'Cancelled'] }, 0, '$totalPrice'] 
                            } 
                        },
                        amountCollected: { 
                            $sum: { 
                                $cond: [{ $and: [{ $eq: ['$isPaid', true] }, { $ne: ['$status', 'Cancelled'] }] }, '$totalPrice', 0] 
                            } 
                        },
                        uncollectedAmount: { 
                            $sum: { 
                                $cond: [{ $and: [{ $eq: ['$isPaid', false] }, { $ne: ['$status', 'Cancelled'] }] }, '$totalPrice', 0] 
                            } 
                        },
                        refunds: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'Cancelled'] }, '$totalPrice', 0]
                            }
                        }
                    }
                },
                { $sort: { _id: -1 } }
            ]);

            // Daily expenses for the same period
            const expenseMatch = {
                restaurantId: restObjId,
                date: { $gte: start, $lte: end }
            };
            if (effectiveBranchId) expenseMatch.branchId = new mongoose.Types.ObjectId(effectiveBranchId);

            const dailyExpenses = await Expense.aggregate([
                { $match: expenseMatch },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        totalIncurred: { $sum: '$amount' },
                        totalPaid: { $sum: '$paidAmount' }
                    }
                }
            ]);

            const expenseMap = new Map();
            dailyExpenses.forEach(e => expenseMap.set(e._id, e));

            reportData = dailyOrders.map(d => {
                const exp = expenseMap.get(d._id) || { totalIncurred: 0, totalPaid: 0 };
                const netProfit = Math.round((d.netSales - exp.totalIncurred) * 100) / 100;
                return {
                    date: d._id,
                    totalOrders: d.totalOrders,
                    grossSales: Math.round(d.grossSales * 100) / 100,
                    discounts: Math.round(d.discounts * 100) / 100,
                    refunds: Math.round(d.refunds * 100) / 100,
                    netSales: Math.round(d.netSales * 100) / 100,
                    amountCollected: Math.round(d.amountCollected * 100) / 100,
                    uncollectedAmount: Math.round(d.uncollectedAmount * 100) / 100,
                    dailyExpenses: Math.round(exp.totalIncurred * 100) / 100,
                    expensesPaid: Math.round(exp.totalPaid * 100) / 100,
                    netProfit
                };
            });

            summary = {
                totalOrders: reportData.reduce((acc, r) => acc + r.totalOrders, 0),
                totalGross: Math.round(reportData.reduce((acc, r) => acc + r.grossSales, 0) * 100) / 100,
                totalNet: Math.round(reportData.reduce((acc, r) => acc + r.netSales, 0) * 100) / 100,
                totalCollected: Math.round(reportData.reduce((acc, r) => acc + r.amountCollected, 0) * 100) / 100,
                totalExpenses: Math.round(reportData.reduce((acc, r) => acc + r.dailyExpenses, 0) * 100) / 100,
                totalNetProfit: Math.round(reportData.reduce((acc, r) => acc + r.netProfit, 0) * 100) / 100
            };
        } 
        
        // 2. Weekly Sales Report
        else if (reportType === 'weekly_sales') {
            const matchStage = {
                restaurantId: restObjId,
                createdAt: { $gte: start, $lte: end },
                status: { $ne: 'Cancelled' }
            };
            if (effectiveBranchId) matchStage.branchId = new mongoose.Types.ObjectId(effectiveBranchId);

            reportData = await Order.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            isoWeekYear: { $isoWeekYear: "$createdAt" },
                            isoWeek: { $isoWeek: "$createdAt" }
                        },
                        startDate: { $min: "$createdAt" },
                        endDate: { $max: "$createdAt" },
                        totalOrders: { $sum: 1 },
                        grossSales: { $sum: { $add: ['$totalPrice', { $ifNull: ['$discountAmount', { $ifNull: ['$discount', 0] }] }] } },
                        discounts: { $sum: { $ifNull: ['$discountAmount', { $ifNull: ['$discount', 0] }] } },
                        netSales: { $sum: '$totalPrice' },
                        amountCollected: { $sum: { $cond: [{ $eq: ['$isPaid', true] }, '$totalPrice', 0] } }
                    }
                },
                { $sort: { "_id.isoWeekYear": -1, "_id.isoWeek": -1 } },
                {
                    $project: {
                        _id: 0,
                        weekNumber: { $concat: ["Week ", { $toString: "$_id.isoWeek" }, " (", { $toString: "$_id.isoWeekYear" }, ")"] },
                        startDate: { $dateToString: { format: "%Y-%m-%d", date: "$startDate" } },
                        endDate: { $dateToString: { format: "%Y-%m-%d", date: "$endDate" } },
                        totalOrders: 1,
                        grossSales: { $round: ["$grossSales", 2] },
                        discounts: { $round: ["$discounts", 2] },
                        netSales: { $round: ["$netSales", 2] },
                        amountCollected: { $round: ["$amountCollected", 2] },
                        averageOrderValue: { $round: [{ $divide: ["$netSales", { $cond: [{ $eq: ["$totalOrders", 0] }, 1, "$totalOrders"] }] }, 2] }
                    }
                }
            ]);

            summary = {
                totalWeeks: reportData.length,
                totalOrders: reportData.reduce((acc, r) => acc + r.totalOrders, 0),
                totalNetSales: Math.round(reportData.reduce((acc, r) => acc + r.netSales, 0) * 100) / 100,
                totalCollected: Math.round(reportData.reduce((acc, r) => acc + r.amountCollected, 0) * 100) / 100
            };
        }

        // 3. Monthly Profit/Loss Report
        else if (reportType === 'monthly_profit_loss') {
            const matchOrders = {
                restaurantId: restObjId,
                createdAt: { $gte: start, $lte: end }
            };
            if (effectiveBranchId) matchOrders.branchId = new mongoose.Types.ObjectId(effectiveBranchId);

            const monthlyOrders = await Order.aggregate([
                { $match: matchOrders },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        totalOrders: { $sum: 1 },
                        grossSales: { $sum: { $add: ['$totalPrice', { $ifNull: ['$discountAmount', { $ifNull: ['$discount', 0] }] }] } },
                        discounts: { $sum: { $ifNull: ['$discountAmount', { $ifNull: ['$discount', 0] }] } },
                        refunds: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, '$totalPrice', 0] } },
                        netSales: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 0, '$totalPrice'] } },
                        amountCollected: { $sum: { $cond: [{ $and: [{ $eq: ['$isPaid', true] }, { $ne: ['$status', 'Cancelled'] }] }, '$totalPrice', 0] } }
                    }
                },
                { $sort: { _id: -1 } }
            ]);

            const matchExpenses = {
                restaurantId: restObjId,
                date: { $gte: start, $lte: end }
            };
            if (effectiveBranchId) matchExpenses.branchId = new mongoose.Types.ObjectId(effectiveBranchId);

            const monthlyExpenses = await Expense.aggregate([
                { $match: matchExpenses },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
                        materialCost: { $sum: { $cond: [{ $eq: ['$category', 'Material purchases'] }, '$amount', 0] } },
                        salaryExpense: { $sum: { $cond: [{ $eq: ['$category', 'Staff salary'] }, '$amount', 0] } },
                        rentExpense: { $sum: { $cond: [{ $eq: ['$category', 'Rent'] }, '$amount', 0] } },
                        utilitiesExpense: { $sum: { $cond: [{ $in: ['$category', ['Electricity', 'Water', 'Internet']] }, '$amount', 0] } },
                        otherExpenses: { $sum: { $cond: [{ $not: [{ $in: ['$category', ['Material purchases', 'Staff salary', 'Rent', 'Electricity', 'Water', 'Internet']] }] }, '$amount', 0] } },
                        totalExpenses: { $sum: '$amount' },
                        totalPaidExpenses: { $sum: '$paidAmount' }
                    }
                }
            ]);

            const orderMap = new Map();
            monthlyOrders.forEach(o => orderMap.set(o._id, o));
            const expMap = new Map();
            monthlyExpenses.forEach(e => expMap.set(e._id, e));

            const allMonths = Array.from(new Set([...orderMap.keys(), ...expMap.keys()])).sort().reverse();

            reportData = allMonths.map(monthStr => {
                const mo = orderMap.get(monthStr) || {
                    totalOrders: 0,
                    grossSales: 0,
                    discounts: 0,
                    refunds: 0,
                    netSales: 0,
                    amountCollected: 0
                };
                const exp = expMap.get(monthStr) || {
                    materialCost: 0,
                    salaryExpense: 0,
                    rentExpense: 0,
                    utilitiesExpense: 0,
                    otherExpenses: 0,
                    totalExpenses: 0,
                    totalPaidExpenses: 0
                };

                const grossProfit = Math.round((mo.netSales - exp.materialCost) * 100) / 100;
                const netOperatingProfit = Math.round((mo.netSales - exp.totalExpenses) * 100) / 100;
                const profitMarginPercent = mo.netSales > 0 ? Math.round((netOperatingProfit / mo.netSales) * 10000) / 100 : 0;

                return {
                    month: monthStr,
                    grossSales: Math.round(mo.grossSales * 100) / 100,
                    discounts: Math.round(mo.discounts * 100) / 100,
                    refunds: Math.round(mo.refunds * 100) / 100,
                    netSales: Math.round(mo.netSales * 100) / 100,
                    materialCost: Math.round(exp.materialCost * 100) / 100,
                    grossProfit,
                    staffSalary: Math.round(exp.salaryExpense * 100) / 100,
                    rent: Math.round(exp.rentExpense * 100) / 100,
                    utilities: Math.round(exp.utilitiesExpense * 100) / 100,
                    otherExpenses: Math.round(exp.otherExpenses * 100) / 100,
                    totalExpenses: Math.round(exp.totalExpenses * 100) / 100,
                    netOperatingProfit,
                    profitMarginPercent
                };
            });

            summary = {
                totalNetSales: Math.round(reportData.reduce((acc, r) => acc + r.netSales, 0) * 100) / 100,
                totalMaterialCost: Math.round(reportData.reduce((acc, r) => acc + r.materialCost, 0) * 100) / 100,
                totalGrossProfit: Math.round(reportData.reduce((acc, r) => acc + r.grossProfit, 0) * 100) / 100,
                totalExpenses: Math.round(reportData.reduce((acc, r) => acc + r.totalExpenses, 0) * 100) / 100,
                totalNetProfit: Math.round(reportData.reduce((acc, r) => acc + r.netOperatingProfit, 0) * 100) / 100
            };
        }

        // 4. Expense Report
        else if (reportType === 'expenses') {
            const query = {
                restaurantId: restObjId,
                date: { $gte: start, $lte: end }
            };
            if (effectiveBranchId) query.branchId = effectiveBranchId;
            if (category && category !== 'All') query.category = category;
            if (paymentStatus && paymentStatus !== 'All') query.paymentStatus = paymentStatus;

            const expenses = await Expense.find(query)
                .sort({ date: -1 })
                .populate('createdBy', 'name email')
                .populate('branchId', 'name')
                .lean();

            reportData = expenses.map(e => ({
                id: e._id,
                expenseDate: new Date(e.date).toISOString().split('T')[0],
                category: e.category,
                description: e.title || e.description || '-',
                amount: e.amount,
                paymentStatus: e.paymentStatus,
                paidAmount: e.paidAmount || 0,
                balanceDue: e.balanceDue || 0,
                dueDate: e.dueDate ? new Date(e.dueDate).toISOString().split('T')[0] : '-',
                paymentMethod: e.paymentMethod || '-',
                branchName: e.branchId?.name || 'Main Branch',
                source: e.source || 'Manual'
            }));

            summary = {
                totalCount: reportData.length,
                totalIncurred: Math.round(reportData.reduce((acc, r) => acc + r.amount, 0) * 100) / 100,
                totalPaid: Math.round(reportData.reduce((acc, r) => acc + r.paidAmount, 0) * 100) / 100,
                totalOutstanding: Math.round(reportData.reduce((acc, r) => acc + r.balanceDue, 0) * 100) / 100
            };
        }

        // 5. Material Purchase Report
        else if (reportType === 'material_purchases') {
            const query = {
                restaurantId: restObjId,
                purchaseDate: { $gte: start, $lte: end }
            };
            if (effectiveBranchId) query.branchId = effectiveBranchId;
            if (supplier && supplier !== 'All') {
                query.$or = [
                    { supplierName: new RegExp(supplier, 'i') },
                    { 'supplier.name': new RegExp(supplier, 'i') }
                ];
            }
            if (paymentStatus && paymentStatus !== 'All') query.paymentStatus = paymentStatus;

            const purchases = await MaterialPurchase.find(query)
                .sort({ purchaseDate: -1 })
                .populate('branchId', 'name')
                .populate('purchasedBy', 'name')
                .lean();

            reportData = purchases.map(p => ({
                id: p._id,
                purchaseDate: new Date(p.purchaseDate).toISOString().split('T')[0],
                invoiceNumber: p.invoiceNumber || '-',
                supplierName: p.supplierName || p.supplier?.name || 'General Supplier',
                supplierContact: p.supplierPhone || p.supplier?.contactPerson || p.supplier?.phone || '-',
                itemCount: p.items?.length || 0,
                subtotal: p.subtotal || 0,
                taxAmount: p.taxAmount || 0,
                totalAmount: p.totalAmount || 0,
                paidAmount: p.paidAmount || 0,
                balanceDue: p.balanceDue || 0,
                paymentStatus: p.paymentStatus,
                branchName: p.branchId?.name || 'Main Branch'
            }));

            summary = {
                totalInvoices: reportData.length,
                totalPurchased: Math.round(reportData.reduce((acc, r) => acc + r.totalAmount, 0) * 100) / 100,
                totalPaid: Math.round(reportData.reduce((acc, r) => acc + r.paidAmount, 0) * 100) / 100,
                totalBalanceDue: Math.round(reportData.reduce((acc, r) => acc + r.balanceDue, 0) * 100) / 100
            };
        }

        // 6. Attendance Report
        else if (reportType === 'attendance') {
            const query = {
                restaurantId: restObjId,
                date: { $gte: start, $lte: end }
            };
            if (effectiveBranchId) query.branchId = effectiveBranchId;
            if (employee && employee !== 'All') query.employee = employee;

            const attendanceRecords = await Attendance.find(query)
                .sort({ date: -1 })
                .populate('employee', 'name employeeId role email')
                .populate('branchId', 'name')
                .lean();

            reportData = attendanceRecords.map(a => ({
                id: a._id,
                date: a.dateString || new Date(a.date).toISOString().split('T')[0],
                employeeId: a.employee?.employeeId || '-',
                employeeName: a.employee?.name || 'Unknown',
                role: a.employee?.role || '-',
                status: a.status,
                checkIn: a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
                checkOut: a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
                lateMinutes: a.lateMinutes || 0,
                overtimeHours: a.overtimeHours || 0,
                workingHours: a.workingHours || 0,
                hasCorrections: (a.correctionHistory && a.correctionHistory.length > 0) ? 'Yes' : 'No'
            }));

            summary = {
                totalRecords: reportData.length,
                presentCount: reportData.filter(r => r.status === 'Present').length,
                absentCount: reportData.filter(r => r.status === 'Absent').length,
                halfDayCount: reportData.filter(r => r.status === 'Half-day').length,
                leaveCount: reportData.filter(r => r.status === 'Leave').length,
                holidayCount: reportData.filter(r => r.status === 'Holiday').length,
                totalOvertimeHours: Math.round(reportData.reduce((acc, r) => acc + r.overtimeHours, 0) * 10) / 10
            };
        }

        // 7. Payroll Report
        else if (reportType === 'payroll') {
            const query = {
                restaurantId: restObjId
            };
            if (effectiveBranchId) query.branchId = effectiveBranchId;
            if (employee && employee !== 'All') query.employee = employee;
            if (paymentStatus && paymentStatus !== 'All') query.paymentStatus = paymentStatus;

            const payrolls = await Payroll.find(query)
                .sort({ year: -1, month: -1 })
                .populate('employee', 'name employeeId role email')
                .populate('branchId', 'name')
                .lean();

            reportData = payrolls.map(p => ({
                id: p._id,
                period: `${p.month} ${p.year}`,
                employeeId: p.employee?.employeeId || '-',
                employeeName: p.employee?.name || 'Unknown',
                role: p.employee?.role || '-',
                basicSalary: p.basicSalary ?? p.salaryConfig?.basicSalary ?? 0,
                earnedBasic: p.calculations?.earnedBasic ?? p.earnedBasicSalary ?? 0,
                overtimePay: p.calculations?.overtimePay ?? p.overtimePay ?? 0,
                bonuses: p.calculations?.bonuses ?? p.bonuses ?? 0,
                deductions: p.calculations?.deductions ?? p.totalDeductions ?? 0,
                grossPayable: p.calculations?.grossSalary ?? p.grossPayable ?? 0,
                netPayable: p.calculations?.netSalaryPayable ?? p.netPayable ?? 0,
                paidAmount: p.paidAmount || 0,
                balanceDue: p.balanceDue || 0,
                paymentStatus: p.paymentStatus,
                status: p.status
            }));

            summary = {
                totalEmployeesCovered: reportData.length,
                totalGrossPayable: Math.round(reportData.reduce((acc, r) => acc + r.grossPayable, 0) * 100) / 100,
                totalNetPayable: Math.round(reportData.reduce((acc, r) => acc + r.netPayable, 0) * 100) / 100,
                totalPaid: Math.round(reportData.reduce((acc, r) => acc + r.paidAmount, 0) * 100) / 100,
                totalPending: Math.round(reportData.reduce((acc, r) => acc + r.balanceDue, 0) * 100) / 100
            };
        }

        // 8. Pending Bills Report
        else if (reportType === 'pending_bills') {
            const query = {
                restaurantId: restObjId,
                paymentStatus: { $in: ['Pending', 'Partially Paid', 'Overdue'] },
                balanceDue: { $gt: 0 }
            };
            if (effectiveBranchId) query.branchId = effectiveBranchId;
            if (category && category !== 'All') query.category = category;

            const pendingExpenses = await Expense.find(query)
                .sort({ dueDate: 1, date: 1 })
                .populate('branchId', 'name')
                .lean();

            const today = new Date();
            reportData = pendingExpenses.map(e => {
                const isOverdue = e.dueDate ? new Date(e.dueDate) < today : false;
                return {
                    id: e._id,
                    category: e.category,
                    title: e.title || e.description,
                    totalAmount: e.amount,
                    paidAmount: e.paidAmount || 0,
                    balanceDue: e.balanceDue || e.amount,
                    dueDate: e.dueDate ? new Date(e.dueDate).toISOString().split('T')[0] : 'Not Set',
                    billingPeriod: e.billingPeriod || '-',
                    status: isOverdue ? 'Overdue' : e.paymentStatus,
                    branchName: e.branchId?.name || 'Main Branch',
                    isRecurring: e.isRecurring ? 'Yes' : 'No'
                };
            });

            summary = {
                totalPendingBills: reportData.length,
                overdueCount: reportData.filter(r => r.status === 'Overdue').length,
                totalAmountDue: Math.round(reportData.reduce((acc, r) => acc + r.balanceDue, 0) * 100) / 100,
                totalOriginalAmount: Math.round(reportData.reduce((acc, r) => acc + r.totalAmount, 0) * 100) / 100
            };
        }

        // Backward compatibility for legacy numeric reports (2: Item Performance, 3: Staff Shift, 4: Tax)
        else if (reportType === 2) {
            const matchStage = { 
                status: 'Completed',
                restaurantId: restObjId,
                createdAt: { $gte: start, $lte: end }
            };
            if (effectiveBranchId) matchStage.branch = effectiveBranchId;

            reportData = await Order.aggregate([
                { $match: matchStage },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.menuItem',
                        name: { $first: '$items.name' },
                        quantitySold: { $sum: '$items.quantity' },
                        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                    }
                },
                { $sort: { quantitySold: -1 } }
            ]);
        } else if (reportType === 3) {
            const matchStage = { 
                status: 'Completed',
                restaurantId: restObjId,
                createdAt: { $gte: start, $lte: end }
            };
            if (effectiveBranchId) matchStage.branch = effectiveBranchId;

            reportData = await Order.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$server',
                        ordersHandled: { $sum: 1 },
                        totalRevenue: { $sum: '$totalAmount' }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'staff'
                    }
                },
                {
                    $project: {
                        staffName: { $ifNull: [{ $arrayElemAt: ['$staff.name', 0] }, 'Staff Member'] },
                        ordersHandled: 1,
                        totalRevenue: 1
                    }
                },
                { $sort: { totalRevenue: -1 } }
            ]);
        } else if (reportType === 4) {
            const matchStage = { 
                status: 'Completed',
                restaurantId: restObjId,
                createdAt: { $gte: start, $lte: end }
            };
            if (effectiveBranchId) matchStage.branch = effectiveBranchId;

            reportData = await Order.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        taxableSales: { $sum: '$subtotal' },
                        taxCollected: { $sum: '$taxAmount' }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
        }

        res.json({
            reportType,
            period,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            branch: effectiveBranchId || 'All',
            summary,
            data: reportData,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: error.message });
    }
};
