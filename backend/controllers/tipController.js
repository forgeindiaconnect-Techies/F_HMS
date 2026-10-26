import Tip from '../models/Tip.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// @desc    Get tips list with filtering
// @route   GET /api/tips
// @access  Private (Admin, Manager)
export const getTips = async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId;
        if (!restaurantId) {
            return res.status(400).json({ message: 'No restaurant associated with this account' });
        }

        const { waiterId, status, startDate, endDate, branchId } = req.query;
        const query = { restaurantId };

        if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
            query.branchId = branchId;
        }

        if (waiterId && mongoose.Types.ObjectId.isValid(waiterId)) {
            query.waiterId = waiterId;
        }

        if (status && ['Pending', 'Settled'].includes(status)) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        const tips = await Tip.find(query)
            .populate('waiterId', 'name email employeeId')
            .populate('settledBy', 'name email role')
            .populate('orderId', 'tableNumber totalPrice orderType serviceType createdAt')
            .sort({ createdAt: -1 });

        res.json(tips);
    } catch (error) {
        console.error('Error fetching tips:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch tips' });
    }
};

// @desc    Get tip summary reports (date-wise, waiter-wise, status-wise)
// @route   GET /api/tips/summary
// @access  Private (Admin, Manager)
export const getTipSummary = async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId;
        if (!restaurantId) {
            return res.status(400).json({ message: 'No restaurant associated with this account' });
        }

        const matchQuery = { restaurantId: new mongoose.Types.ObjectId(restaurantId) };
        if (req.query.branchId && mongoose.Types.ObjectId.isValid(req.query.branchId)) {
            matchQuery.branchId = new mongoose.Types.ObjectId(req.query.branchId);
        }

        // Total, Settled, Pending aggregated
        const totalsAgg = await Tip.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalTips: { $sum: '$amount' },
                    totalCount: { $sum: 1 },
                    settledTips: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Settled'] }, '$amount', 0]
                        }
                    },
                    settledCount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Settled'] }, 1, 0]
                        }
                    },
                    pendingTips: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Pending'] }, '$amount', 0]
                        }
                    },
                    pendingCount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const totals = totalsAgg[0] || {
            totalTips: 0,
            totalCount: 0,
            settledTips: 0,
            settledCount: 0,
            pendingTips: 0,
            pendingCount: 0
        };

        // Waiter-wise breakdown
        const waiterSummary = await Tip.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$waiterId',
                    waiterName: { $first: '$waiterName' },
                    totalAmount: { $sum: '$amount' },
                    tipCount: { $sum: 1 },
                    settledAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Settled'] }, '$amount', 0]
                        }
                    },
                    pendingAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Pending'] }, '$amount', 0]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'waiterInfo'
                }
            },
            {
                $project: {
                    waiterId: '$_id',
                    waiterName: {
                        $ifNull: [{ $arrayElemAt: ['$waiterInfo.name', 0] }, '$waiterName']
                    },
                    employeeId: { $arrayElemAt: ['$waiterInfo.employeeId', 0] },
                    totalAmount: 1,
                    tipCount: 1,
                    settledAmount: 1,
                    pendingAmount: 1
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        // Date-wise breakdown (last 30 days)
        const dateSummary = await Tip.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    totalAmount: { $sum: '$amount' },
                    tipCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            totals,
            waiterSummary,
            dateSummary
        });
    } catch (error) {
        console.error('Error fetching tip summary:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch tip summary' });
    }
};

// @desc    Get tips for the authenticated waiter
// @route   GET /api/tips/waiter-mine
// @access  Private (Waiter, Admin, Manager)
export const getMyWaiterTips = async (req, res) => {
    try {
        const waiterId = req.user._id;
        const restaurantId = req.user.restaurantId;

        if (!restaurantId) {
            return res.status(400).json({ message: 'No restaurant associated with this staff user' });
        }

        const tips = await Tip.find({
            restaurantId,
            waiterId
        })
        .populate('orderId', 'tableNumber totalPrice serviceType createdAt')
        .sort({ createdAt: -1 })
        .limit(50);

        // Compute metrics
        const totalEarned = tips.reduce((acc, t) => acc + (t.amount || 0), 0);
        const settledTips = tips.filter(t => t.status === 'Settled').reduce((acc, t) => acc + (t.amount || 0), 0);
        const pendingTips = tips.filter(t => t.status === 'Pending').reduce((acc, t) => acc + (t.amount || 0), 0);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayTips = tips
            .filter(t => new Date(t.date || t.createdAt) >= todayStart)
            .reduce((acc, t) => acc + (t.amount || 0), 0);

        res.json({
            totalEarned,
            todayTips,
            settledTips,
            pendingTips,
            tipCount: tips.length,
            records: tips
        });
    } catch (error) {
        console.error('Error fetching waiter tips:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch waiter tips' });
    }
};

// @desc    Settle tips for waiters with verified settlement record
// @route   POST /api/tips/settle
// @access  Private (Admin, Manager)
export const settleTips = async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId;
        const { tipIds, waiterId, transactionReference, notes } = req.body;

        const updateFilter = { restaurantId, status: 'Pending' };

        if (Array.isArray(tipIds) && tipIds.length > 0) {
            updateFilter._id = { $in: tipIds };
        } else if (waiterId && mongoose.Types.ObjectId.isValid(waiterId)) {
            updateFilter.waiterId = waiterId;
        } else {
            return res.status(400).json({ message: 'Must provide either specific tipIds or a valid waiterId to settle' });
        }

        const updateResult = await Tip.updateMany(updateFilter, {
            $set: {
                status: 'Settled',
                settledAt: new Date(),
                settledBy: req.user._id,
                transactionReference: transactionReference || `SETTLE-${Date.now()}`,
                notes: notes || 'Settled through admin console'
            }
        });

        res.json({
            success: true,
            message: `Successfully settled ${updateResult.modifiedCount} tip transaction(s)`,
            settledCount: updateResult.modifiedCount
        });
    } catch (error) {
        console.error('Error settling tips:', error);
        res.status(500).json({ message: error.message || 'Failed to settle tips' });
    }
};
