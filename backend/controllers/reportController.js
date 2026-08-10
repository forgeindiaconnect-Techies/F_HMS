import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import Plan from '../models/Plan.js';

// @desc    Generate report data
// @route   POST /api/reports/generate
// @access  Private
export const generateReport = async (req, res) => {
    const { reportType, startDate, endDate, branch } = req.body;

    try {
        const restaurant = await Restaurant.findById(req.user.restaurantId);
        const planName = restaurant?.subscription?.plan || 'Basic';
        const plan = await Plan.findOne({ name: planName });
        
        let hasPermission = true;
        if (plan) {
            if ([3, 4].includes(Number(reportType))) {
                hasPermission = plan.features.some(f => 
                    f.toLowerCase() === 'advanced analytics' || 
                    f.toLowerCase() === 'profit & loss' || 
                    f.toLowerCase() === 'staff performance' ||
                    f.toLowerCase() === 'basic reports'
                );
            }
        } else {
            // Fallback checking
            if (planName === 'Basic' && [3, 4].includes(Number(reportType))) {
                hasPermission = false;
            }
        }

        if (!hasPermission) {
            return res.status(403).json({
                message: `This report is not available in your current ${planName} plan. Please upgrade your subscription.`,
                requiresUpgrade: true
            });
        }

        let matchStage = { status: 'Completed' };
        
        if (startDate && endDate) {
            matchStage.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            matchStage.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            matchStage.createdAt = { $lte: new Date(endDate) };
        }

        if (branch && branch !== 'All Branches' && branch !== '') {
            matchStage.branch = branch;
        } else if (req.user && req.user.branchId) {
             matchStage.branch = req.user.branchId;
        }

        let reportData = [];

        if (reportType === 1) {
            // Daily Sales Summary
            reportData = await Order.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        totalRevenue: { $sum: '$totalAmount' },
                        totalTax: { $sum: '$taxAmount' },
                        orderCount: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
        } else if (reportType === 2) {
            // Item Performance
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
            // Staff Shift Report (Mocked using Order creators/servers)
            reportData = await Order.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$server', // Assuming we have server IDs, though we might not. If null, we'll map to Unknown
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
                        staffName: { $ifNull: [{ $arrayElemAt: ['$staff.name', 0] }, 'Unknown Staff/Self-Serve'] },
                        ordersHandled: 1,
                        totalRevenue: 1
                    }
                },
                { $sort: { totalRevenue: -1 } }
            ]);
        } else if (reportType === 4) {
            // Tax & Compliance
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
            startDate,
            endDate,
            branch,
            data: reportData,
            generatedAt: new Date()
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
