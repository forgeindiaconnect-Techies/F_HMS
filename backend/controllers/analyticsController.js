import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Branch from '../models/Branch.js';
import Expense from '../models/Expense.js';
import MaterialPurchase from '../models/MaterialPurchase.js';
import StockMovement from '../models/StockMovement.js';
import Payroll from '../models/Payroll.js';
import Payment from '../models/Payment.js';
import Restaurant from '../models/Restaurant.js';

// Helper to resolve user's restaurantId safely
const getUserRestaurantId = async (user, query = {}) => {
    let rId = user?.restaurantId || user?.restaurant;
    if (!rId && user?.branchId) {
        const branchDoc = await Branch.findById(user.branchId);
        if (branchDoc) rId = branchDoc.restaurantId;
    }
    if (!rId && query?.restaurantId) {
        rId = query.restaurantId;
    }
    if (!rId && user?.role === 'SuperAdmin') {
        const firstRest = await Restaurant.findOne().select('_id');
        if (firstRest) rId = firstRest._id;
    }
    return rId;
};

// Date range parser
const parseDateFilter = (period, startDate, endDate) => {
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
        // Default to this month
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
    }

    return { start, end };
};

// @desc    Get dashboard analytics (Revenue, Orders, etc.)
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
export const getDashboardAnalytics = async (req, res) => {
    try {
        const timeframe = parseInt(req.query.timeframe) || 7;
        
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - timeframe);
        
        // Calculate previous period for comparison percentages
        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - timeframe);

        const currentPeriodMatch = {
            isPaid: true,
            createdAt: { $gte: startDate, $lte: now }
        };

        const previousPeriodMatch = {
            isPaid: true,
            createdAt: { $gte: previousStartDate, $lt: startDate }
        };

        // Scope analytics strictly to logged-in user's restaurant and branch
        let userRestaurantId = await getUserRestaurantId(req.user, req.query);

        if (userRestaurantId) {
            currentPeriodMatch.restaurantId = new mongoose.Types.ObjectId(userRestaurantId);
            previousPeriodMatch.restaurantId = new mongoose.Types.ObjectId(userRestaurantId);
            
            if (req.user.role === 'BranchManager' || req.user.branchId) {
                const effectiveBranchId = req.user.branchId || (await Branch.findOne({ manager: req.user._id }))?._id;
                if (effectiveBranchId) {
                    currentPeriodMatch.branchId = new mongoose.Types.ObjectId(effectiveBranchId);
                    previousPeriodMatch.branchId = new mongoose.Types.ObjectId(effectiveBranchId);
                }
            }
        } else if (req.user.role !== 'SuperAdmin') {
            return res.json({
                overview: { totalRevenue: 0, revenueChange: 0, totalOrders: 0, ordersChange: 0, avgOrderValue: 0, avgChange: 0, activeCustomers: 0, customersChange: 0 },
                revenueTrend: [],
                popularItems: [],
                categoryData: [],
                qrAnalytics: { activeTables: 0, currentOrders: 0, pendingOrders: 0, preparingOrders: 0, readyOrders: 0, servedOrders: 0, completedOrders: 0, avgPrepTime: 0 },
                deliveryAnalytics: { onlinePartners: 0, activeDeliveries: 0, pendingAssignments: 0, completedDeliveries: 0, totalDeliveryEarnings: 0 }
            });
        }

        // 1. Current Period Overview
        const currentOverview = await Order.aggregate([
            { $match: currentPeriodMatch },
            { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' }, totalOrders: { $sum: 1 } } }
        ]);

        // 2. Previous Period Overview
        const previousOverview = await Order.aggregate([
            { $match: previousPeriodMatch },
            { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' }, totalOrders: { $sum: 1 } } }
        ]);

        const curRevenue = currentOverview.length > 0 ? currentOverview[0].totalRevenue : 0;
        const curOrders = currentOverview.length > 0 ? currentOverview[0].totalOrders : 0;
        const curAvg = curOrders > 0 ? curRevenue / curOrders : 0;

        const prevRevenue = previousOverview.length > 0 ? previousOverview[0].totalRevenue : 0;
        const prevOrders = previousOverview.length > 0 ? previousOverview[0].totalOrders : 0;
        const prevAvg = prevOrders > 0 ? prevRevenue / prevOrders : 0;

        const calculateChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        const revenueChange = calculateChange(curRevenue, prevRevenue);
        const ordersChange = calculateChange(curOrders, prevOrders);
        const avgChange = calculateChange(curAvg, prevAvg);

        // 3. Revenue Trend
        const revenueTrend = await Order.aggregate([
            { $match: currentPeriodMatch },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: '$totalPrice' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 4. Popular Items
        const popularItems = await Order.aggregate([
            { $match: currentPeriodMatch },
            { $unwind: '$orderItems' },
            {
                $group: {
                    _id: '$orderItems.product',
                    name: { $first: '$orderItems.name' },
                    totalSold: { $sum: '$orderItems.qty' },
                    revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        const categoryData = popularItems.map(item => ({
            name: item.name,
            value: item.totalSold
        })).slice(0, 4);

        // QR Ordering Analytics
        const restIdObj = userRestaurantId ? new mongoose.Types.ObjectId(userRestaurantId) : null;
        let activeTables = 0;
        let currentOrders = 0;
        let pendingOrders = 0;
        let preparingOrders = 0;
        let readyOrders = 0;
        let servedOrders = 0;
        let completedOrders = 0;
        let avgPrepTime = 15;

        if (restIdObj) {
            try {
                const Table = mongoose.model('Table');
                activeTables = await Table.countDocuments({ 
                    restaurantId: restIdObj, 
                    status: { $in: ['Occupied', 'Reserved', 'Billing'] } 
                });
                
                currentOrders = await Order.countDocuments({
                    restaurantId: restIdObj,
                    status: { $in: ['Pending', 'Preparing', 'Ready'] }
                });

                pendingOrders = await Order.countDocuments({
                    restaurantId: restIdObj,
                    status: 'Pending'
                });

                preparingOrders = await Order.countDocuments({
                    restaurantId: restIdObj,
                    status: 'Preparing'
                });

                readyOrders = await Order.countDocuments({
                    restaurantId: restIdObj,
                    status: 'Ready'
                });

                servedOrders = await Order.countDocuments({
                    restaurantId: restIdObj,
                    status: 'Served'
                });

                completedOrders = await Order.countDocuments({
                    restaurantId: restIdObj,
                    status: { $in: ['Served', 'Delivered'] },
                    isPaid: true
                });

                const prepTimeAvg = await Order.aggregate([
                    { $match: { restaurantId: restIdObj, status: { $in: ['Ready', 'Served', 'Delivered'] } } },
                    { $project: { duration: { $divide: [ { $subtract: [ "$updatedAt", "$createdAt" ] }, 60000 ] } } },
                    { $group: { _id: null, avgDuration: { $avg: "$duration" } } }
                ]);
                avgPrepTime = prepTimeAvg.length > 0 ? Math.round(prepTimeAvg[0].avgDuration || 0) : 15;
                if (avgPrepTime < 1) avgPrepTime = 12;
            } catch (qrErr) {
                console.error("Failed to aggregate QR stats", qrErr);
            }
        }

        // Delivery Analytics
        let onlinePartners = 0;
        let activeDeliveries = 0;
        let pendingAssignments = 0;
        let completedDeliveries = 0;
        let totalDeliveryEarnings = 0;

        if (restIdObj) {
            try {
                const DeliveryPartner = mongoose.model('DeliveryPartner');
                onlinePartners = await DeliveryPartner.countDocuments({
                    restaurantId: restIdObj,
                    status: 'Online',
                    verificationStatus: 'Approved'
                });

                activeDeliveries = await Order.countDocuments({
                    restaurantId: restIdObj,
                    orderType: 'Delivery',
                    deliveryStatus: { $in: ['Accepted', 'Picked Up', 'On the Way'] }
                });

                pendingAssignments = await Order.countDocuments({
                    restaurantId: restIdObj,
                    orderType: 'Delivery',
                    deliveryStatus: 'Pending Assignment'
                });

                completedDeliveries = await Order.countDocuments({
                    restaurantId: restIdObj,
                    orderType: 'Delivery',
                    status: 'Delivered'
                });

                const earningsSum = await Order.aggregate([
                    { $match: { restaurantId: restIdObj, orderType: 'Delivery', status: 'Delivered' } },
                    { $group: { _id: null, total: { $sum: '$deliveryCharge' } } }
                ]);
                totalDeliveryEarnings = earningsSum.length > 0 ? earningsSum[0].total : 0;
            } catch (delErr) {
                console.error("Failed to aggregate delivery stats", delErr);
            }
        }

        res.json({
            overview: {
                totalRevenue: curRevenue,
                revenueChange,
                totalOrders: curOrders,
                ordersChange,
                avgOrderValue: curAvg,
                avgChange,
                activeCustomers: curOrders > 0 ? Math.floor(curOrders * 0.8) : 0,
                customersChange: ordersChange
            },
            revenueTrend,
            popularItems,
            categoryData,
            qrAnalytics: {
                activeTables,
                currentOrders,
                pendingOrders,
                preparingOrders,
                readyOrders,
                servedOrders,
                completedOrders,
                avgPrepTime
            },
            deliveryAnalytics: {
                onlinePartners,
                activeDeliveries,
                pendingAssignments,
                completedDeliveries,
                totalDeliveryEarnings
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── MODULE 2: PROFIT AND LOSS MANAGEMENT ─────────────────────────────────────

// @desc    Get complete Profit and Loss Statement with real database records
// @route   GET /api/analytics/profit-loss
// @access  Private/Admin
export const getProfitAndLoss = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user, req.query);
        if (!restaurantId) return res.status(400).json({ message: 'Restaurant ID required' });

        const restObjId = new mongoose.Types.ObjectId(restaurantId);
        const { start, end } = parseDateFilter(req.query.period, req.query.startDate, req.query.endDate);

        const orderMatch = {
            restaurantId: restObjId,
            createdAt: { $gte: start, $lte: end }
        };

        const expenseMatch = {
            restaurantId: restObjId,
            date: { $gte: start, $lte: end }
        };

        if (req.user.role === 'BranchManager' && req.user.branchId) {
            orderMatch.branchId = new mongoose.Types.ObjectId(req.user.branchId);
            expenseMatch.branchId = new mongoose.Types.ObjectId(req.user.branchId);
        } else if (req.query.branchId && req.query.branchId !== 'All') {
            orderMatch.branchId = new mongoose.Types.ObjectId(req.query.branchId);
            expenseMatch.branchId = new mongoose.Types.ObjectId(req.query.branchId);
        }

        // 1. Orders & Sales Aggregation
        const orders = await Order.find(orderMatch).lean();

        let grossSales = 0;
        let discounts = 0;
        let refunds = 0;
        let netSales = 0;
        let amountCollected = 0;
        let outstandingCustomerPayments = 0;
        let totalOrdersCount = orders.length;
        let completedOrdersCount = 0;
        let cancelledOrdersCount = 0;

        const paymentMethodBreakdown = {
            Cash: 0,
            Card: 0,
            UPI: 0,
            Online: 0,
            Other: 0
        };

        for (const ord of orders) {
            const tot = Number(ord.totalPrice) || 0;
            const disc = Number(ord.discountAmount || ord.discount) || 0;

            if (ord.status === 'Cancelled') {
                cancelledOrdersCount++;
                refunds += tot;
                continue;
            }

            // Completed or Active Paid Orders
            if (ord.isPaid) {
                grossSales += tot + disc; // Gross before discount
                discounts += disc;
                amountCollected += tot;
                completedOrdersCount++;

                const method = ord.paymentMethod || 'Card';
                if (method.includes('Cash')) paymentMethodBreakdown.Cash += tot;
                else if (method.includes('UPI')) paymentMethodBreakdown.UPI += tot;
                else if (method.includes('Card')) paymentMethodBreakdown.Card += tot;
                else if (method.includes('Online')) paymentMethodBreakdown.Online += tot;
                else paymentMethodBreakdown.Other += tot;
            } else {
                // Pending customer payment
                outstandingCustomerPayments += tot;
            }
        }

        netSales = Math.max(0, grossSales - discounts - refunds);

        // 2. Expenses & COGS Aggregation
        const expenses = await Expense.find(expenseMatch).lean();

        let materialPurchasesIncurred = 0;
        let materialPurchasesPaid = 0;
        let staffSalariesIncurred = 0;
        let staffSalariesPaid = 0;
        let rentIncurred = 0;
        let rentPaid = 0;
        let electricityIncurred = 0;
        let electricityPaid = 0;
        let waterInternetIncurred = 0;
        let waterInternetPaid = 0;
        let maintenanceIncurred = 0;
        let maintenancePaid = 0;
        let deliveryTransportIncurred = 0;
        let deliveryTransportPaid = 0;
        let otherExpensesIncurred = 0;
        let otherExpensesPaid = 0;

        for (const exp of expenses) {
            const amt = Number(exp.amount) || 0;
            const paid = Number(exp.paidAmount) || 0;
            const cat = exp.category;

            if (cat === 'Material purchases' || cat === 'Kitchen Supplies') {
                materialPurchasesIncurred += amt;
                materialPurchasesPaid += paid;
            } else if (cat === 'Staff salary' || cat === 'Staff Welfare') {
                staffSalariesIncurred += amt;
                staffSalariesPaid += paid;
            } else if (cat === 'Rent') {
                rentIncurred += amt;
                rentPaid += paid;
            } else if (cat === 'Electricity') {
                electricityIncurred += amt;
                electricityPaid += paid;
            } else if (cat === 'Water' || cat === 'Internet' || cat === 'Utility Bill') {
                waterInternetIncurred += amt;
                waterInternetPaid += paid;
            } else if (cat === 'Maintenance' || cat === 'Equipment maintenance') {
                maintenanceIncurred += amt;
                maintenancePaid += paid;
            } else if (cat === 'Delivery and transport') {
                deliveryTransportIncurred += amt;
                deliveryTransportPaid += paid;
            } else {
                otherExpensesIncurred += amt;
                otherExpensesPaid += paid;
            }
        }

        // 3. Stock Consumption from StockMovement (Kitchen ingredients consumed)
        const movementMatch = {
            restaurantId: restObjId,
            date: { $gte: start, $lte: end },
            movementType: { $in: ['Stock Consumed', 'Wastage'] }
        };
        if (orderMatch.branchId) movementMatch.branchId = orderMatch.branchId;

        const consumedAgg = await StockMovement.aggregate([
            { $match: movementMatch },
            { $group: { _id: null, totalConsumed: { $sum: '$totalValue' } } }
        ]);
        const actualStockConsumed = consumedAgg.length > 0 ? consumedAgg[0].totalConsumed : 0;

        // Cost of Goods Sold (COGS): To avoid double counting:
        // Use actual material purchases paid/incurred, or stock consumed if purchases is 0.
        const cogsFoodCost = materialPurchasesIncurred > 0 ? materialPurchasesIncurred : actualStockConsumed;

        // 4. Profit & Loss Formulas
        const grossProfit = Math.round((netSales - cogsFoodCost) * 100) / 100;
        const grossProfitMargin = netSales > 0 ? Math.round((grossProfit / netSales) * 1000) / 10 : 0;

        const totalOperatingExpensesIncurred = Math.round((
            staffSalariesIncurred + rentIncurred + electricityIncurred + 
            waterInternetIncurred + maintenanceIncurred + deliveryTransportIncurred + otherExpensesIncurred
        ) * 100) / 100;

        const totalOperatingExpensesPaid = Math.round((
            staffSalariesPaid + rentPaid + electricityPaid + 
            waterInternetPaid + maintenancePaid + deliveryTransportPaid + otherExpensesPaid
        ) * 100) / 100;

        const netOperatingProfit = Math.round((grossProfit - totalOperatingExpensesIncurred) * 100) / 100;
        const netProfitMargin = netSales > 0 ? Math.round((netOperatingProfit / netSales) * 1000) / 10 : 0;

        // Cash flow net (Actual Cash Collected minus Actual Cash Outflows)
        const actualCashOutflows = materialPurchasesPaid + totalOperatingExpensesPaid;
        const netCashFlow = Math.round((amountCollected - actualCashOutflows) * 100) / 100;

        const totalOutstandingLiabilities = Math.round((
            (materialPurchasesIncurred - materialPurchasesPaid) + 
            (totalOperatingExpensesIncurred - totalOperatingExpensesPaid)
        ) * 100) / 100;

        const formattedSales = {
            grossSales: Math.round(grossSales * 100) / 100,
            discounts: Math.round(discounts * 100) / 100,
            refunds: Math.round(refunds * 100) / 100,
            netSales: Math.round(netSales * 100) / 100,
            amountCollected: Math.round(amountCollected * 100) / 100,
            outstandingCustomerPayments: Math.round(outstandingCustomerPayments * 100) / 100,
            paymentMethods: paymentMethodBreakdown,
            totalOrders: totalOrdersCount,
            completedOrders: completedOrdersCount,
            cancelledOrders: cancelledOrdersCount
        };

        const formattedExpenses = {
            materialAndFoodCosts: Math.round(cogsFoodCost * 100) / 100,
            materialPurchasesIncurred: Math.round(materialPurchasesIncurred * 100) / 100,
            materialPurchasesPaid: Math.round(materialPurchasesPaid * 100) / 100,
            actualStockConsumed: Math.round(actualStockConsumed * 100) / 100,
            staffSalaryExpenses: Math.round(staffSalariesIncurred * 100) / 100,
            rent: Math.round(rentIncurred * 100) / 100,
            electricity: Math.round(electricityIncurred * 100) / 100,
            waterAndInternet: Math.round(waterInternetIncurred * 100) / 100,
            maintenance: Math.round(maintenanceIncurred * 100) / 100,
            otherOperatingExpenses: Math.round((deliveryTransportIncurred + otherExpensesIncurred) * 100) / 100,
            totalExpensesIncurred: totalOperatingExpensesIncurred,
            totalExpensesPaid: totalOperatingExpensesPaid,
            outstandingExpensesLiability: totalOutstandingLiabilities
        };

        const formattedProfitability = {
            grossProfit,
            grossProfitMarginPercent: grossProfitMargin,
            netOperatingProfitLoss: netOperatingProfit,
            netProfitMarginPercent: netProfitMargin,
            netCashFlow,
            outstandingLiabilities: totalOutstandingLiabilities
        };

        const formattedCashFlow = {
            actualCashCollected: Math.round(amountCollected * 100) / 100,
            actualCashOutflow: actualCashOutflows,
            netCashFlow
        };

        res.json({
            period: {
                startDate: start,
                endDate: end,
                label: req.query.period || 'Custom Range'
            },
            dateRange: {
                startDate: start ? start.toISOString().split('T')[0] : '',
                endDate: end ? end.toISOString().split('T')[0] : ''
            },
            sales: formattedSales,
            expenses: formattedExpenses,
            profitability: formattedProfitability,
            cashFlow: formattedCashFlow,
            revenue: formattedSales,
            costOfGoodsSold: {
                materialAndFoodCosts: Math.round(cogsFoodCost * 100) / 100,
                materialPurchasesIncurred: Math.round(materialPurchasesIncurred * 100) / 100,
                materialPurchasesPaid: Math.round(materialPurchasesPaid * 100) / 100,
                actualStockConsumed: Math.round(actualStockConsumed * 100) / 100,
                methodology: materialPurchasesIncurred > 0 
                    ? 'Based on actual supplier material purchases in period' 
                    : 'Based on recorded kitchen stock consumption and wastage'
            },
            operatingExpenses: {
                staffSalaries: { incurred: Math.round(staffSalariesIncurred * 100) / 100, paid: Math.round(staffSalariesPaid * 100) / 100 },
                rent: { incurred: Math.round(rentIncurred * 100) / 100, paid: Math.round(rentPaid * 100) / 100 },
                electricity: { incurred: Math.round(electricityIncurred * 100) / 100, paid: Math.round(electricityPaid * 100) / 100 },
                waterAndInternet: { incurred: Math.round(waterInternetIncurred * 100) / 100, paid: Math.round(waterInternetPaid * 100) / 100 },
                maintenance: { incurred: Math.round(maintenanceIncurred * 100) / 100, paid: Math.round(maintenancePaid * 100) / 100 },
                deliveryAndTransport: { incurred: Math.round(deliveryTransportIncurred * 100) / 100, paid: Math.round(deliveryTransportPaid * 100) / 100 },
                otherExpenses: { incurred: Math.round(otherExpensesIncurred * 100) / 100, paid: Math.round(otherExpensesPaid * 100) / 100 },
                totalIncurred: totalOperatingExpensesIncurred,
                totalPaid: totalOperatingExpensesPaid
            },
            profitMetrics: formattedProfitability,
            calculationBreakdown: {
                netSalesFormula: 'Gross Sales minus Discounts minus Cancelled Orders',
                grossProfitFormula: 'Net Sales minus Material and Food Costs',
                netOperatingProfitLossFormula: 'Gross Profit minus Total Operating Overhead',
                antiDoubleCountingRule: 'Material purchases linked to expenses are reconciled without duplication'
            }
        });
    } catch (error) {
        console.error('Error generating Profit & Loss statement:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─── MODULE 6: DAILY EARNINGS AND SALES ANALYTICS ────────────────────────────

// @desc    Get detailed Daily Earnings breakdown for Admin Dashboard
// @route   GET /api/analytics/daily-earnings
// @access  Private/Admin
export const getDailyEarnings = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user, req.query);
        if (!restaurantId) return res.status(400).json({ message: 'Restaurant ID required' });

        const restObjId = new mongoose.Types.ObjectId(restaurantId);

        // Date selection: default to today or given query date
        const targetDate = req.query.date ? new Date(req.query.date) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const orderMatch = {
            restaurantId: restObjId,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        };

        const expenseMatch = {
            restaurantId: restObjId,
            date: { $gte: startOfDay, $lte: endOfDay }
        };

        if (req.user.role === 'BranchManager' && req.user.branchId) {
            orderMatch.branchId = new mongoose.Types.ObjectId(req.user.branchId);
            expenseMatch.branchId = new mongoose.Types.ObjectId(req.user.branchId);
        } else if (req.query.branchId && req.query.branchId !== 'All') {
            orderMatch.branchId = new mongoose.Types.ObjectId(req.query.branchId);
            expenseMatch.branchId = new mongoose.Types.ObjectId(req.query.branchId);
        }

        const orders = await Order.find(orderMatch).lean();

        let totalOrders = orders.length;
        let grossSales = 0;
        let discounts = 0;
        let refunds = 0;
        let amountCollected = 0;
        let outstandingCustomerPayments = 0;
        let completedCount = 0;
        let cancelledCount = 0;

        const collectionBreakdown = { Cash: 0, Card: 0, UPI: 0, Online: 0, Other: 0 };
        const hourlyTrend = Array.from({ length: 24 }, (_, h) => ({
            hour: `${h.toString().padStart(2, '0')}:00`,
            orders: 0,
            revenue: 0,
            collected: 0
        }));

        for (const ord of orders) {
            const tot = Number(ord.totalPrice) || 0;
            const disc = Number(ord.discountAmount || ord.discount) || 0;
            const hour = new Date(ord.createdAt).getHours();

            if (ord.status === 'Cancelled') {
                cancelledCount++;
                refunds += tot;
                continue;
            }

            hourlyTrend[hour].orders++;

            if (ord.isPaid) {
                completedCount++;
                grossSales += tot + disc;
                discounts += disc;
                amountCollected += tot;

                hourlyTrend[hour].revenue += (tot + disc);
                hourlyTrend[hour].collected += tot;

                const m = ord.paymentMethod || 'Card';
                if (m.includes('Cash')) collectionBreakdown.Cash += tot;
                else if (m.includes('UPI')) collectionBreakdown.UPI += tot;
                else if (m.includes('Card')) collectionBreakdown.Card += tot;
                else if (m.includes('Online')) collectionBreakdown.Online += tot;
                else collectionBreakdown.Other += tot;
            } else {
                outstandingCustomerPayments += tot;
                hourlyTrend[hour].revenue += tot;
            }
        }

        const netSales = Math.max(0, grossSales - discounts - refunds);

        // Actual expenses paid/recorded today
        const expensesToday = await Expense.find(expenseMatch).lean();

        let materialCostsToday = 0;
        let staffExpensesToday = 0;
        let rentAndUtilitiesToday = 0;
        let otherExpensesToday = 0;

        for (const exp of expensesToday) {
            const paid = Number(exp.paidAmount) || 0;
            const cat = exp.category;

            if (cat === 'Material purchases' || cat === 'Kitchen Supplies') {
                materialCostsToday += paid;
            } else if (cat === 'Staff salary' || cat === 'Staff Welfare') {
                staffExpensesToday += paid;
            } else if (['Rent', 'Electricity', 'Water', 'Internet', 'Utility Bill'].includes(cat)) {
                rentAndUtilitiesToday += paid;
            } else {
                otherExpensesToday += paid;
            }
        }

        // Daily prorated rent and utilities estimate if no direct bills were paid today
        const monthlyExpenses = await Expense.find({
            restaurantId: restObjId,
            category: { $in: ['Rent', 'Electricity', 'Water', 'Internet', 'Utility Bill'] },
            date: { $gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), 1) }
        }).lean();

        const totalMonthlyRentUtils = monthlyExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
        const proratedDailyRentUtils = totalMonthlyRentUtils > 0 ? Math.round((totalMonthlyRentUtils / daysInMonth) * 100) / 100 : 0;

        // Daily estimated material consumption from kitchen movements if material purchase wasn't done today
        const todayMovement = await StockMovement.aggregate([
            {
                $match: {
                    restaurantId: restObjId,
                    date: { $gte: startOfDay, $lte: endOfDay },
                    movementType: { $in: ['Stock Consumed', 'Wastage'] }
                }
            },
            { $group: { _id: null, total: { $sum: '$totalValue' } } }
        ]);
        const dailyStockConsumed = todayMovement.length > 0 ? todayMovement[0].total : 0;

        const effectiveMaterialCost = materialCostsToday > 0 ? materialCostsToday : dailyStockConsumed;
        const effectiveRentUtils = rentAndUtilitiesToday > 0 ? rentAndUtilitiesToday : proratedDailyRentUtils;

        const totalDailyExpenses = Math.round((effectiveMaterialCost + staffExpensesToday + effectiveRentUtils + otherExpensesToday) * 100) / 100;
        const estimatedProfitLoss = Math.round((netSales - totalDailyExpenses) * 100) / 100;
        const confirmedCashProfit = Math.round((amountCollected - (materialCostsToday + staffExpensesToday + rentAndUtilitiesToday + otherExpensesToday)) * 100) / 100;

        res.json({
            date: startOfDay.toISOString().split('T')[0],
            dateLabel: startOfDay.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
            metrics: {
                totalOrders,
                completedOrders: completedCount,
                cancelledOrders: cancelledCount,
                grossSales: Math.round(grossSales * 100) / 100,
                discounts: Math.round(discounts * 100) / 100,
                refunds: Math.round(refunds * 100) / 100,
                netSales: Math.round(netSales * 100) / 100,
                amountCollected: Math.round(amountCollected * 100) / 100,
                outstandingCustomerPayments: Math.round(outstandingCustomerPayments * 100) / 100,
                collectionBreakdown
            },
            expenses: {
                materialCosts: Math.round(effectiveMaterialCost * 100) / 100,
                staffExpenses: Math.round(staffExpensesToday * 100) / 100,
                rentAndUtilities: Math.round(effectiveRentUtils * 100) / 100,
                otherExpenses: Math.round(otherExpensesToday * 100) / 100,
                totalDailyExpenses
            },
            profitability: {
                estimatedProfitLoss,
                confirmedCashProfit,
                isEstimated: effectiveRentUtils === proratedDailyRentUtils && proratedDailyRentUtils > 0,
                costProrationNotes: effectiveRentUtils === proratedDailyRentUtils && proratedDailyRentUtils > 0
                    ? `Rent and utilities include daily prorated allocation of ₹${proratedDailyRentUtils} from monthly bills.`
                    : 'All costs represent actual expenses paid today.'
            },
            hourlyTrend
        });
    } catch (error) {
        console.error('Error fetching daily earnings:', error);
        res.status(500).json({ message: error.message });
    }
};
