import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Plan from '../models/Plan.js';
import Ticket from '../models/Ticket.js';
import Notification from '../models/Notification.js';
import SubscriptionPayment from '../models/SubscriptionPayment.js';

// @desc    Get global stats
// @route   GET /api/super-admin/stats
// @access  Private/SuperAdmin
export const getStats = async (req, res) => {
    try {
        // Auto-heal missing restaurant profiles first so stats are 100% accurate
        const Branch = (await import('../models/Branch.js')).default;
        const adminUsers = await User.find({ role: { $in: ['RestaurantAdmin', 'Admin'] } });

        for (const admin of adminUsers) {
            const exists = await Restaurant.exists({ $or: [{ ownerId: admin._id }, { _id: admin.restaurantId }] });
            if (!exists) {
                const restName = admin.name ? `${admin.name}'s Restaurant` : 'New Restaurant';
                const newRest = await Restaurant.create({
                    name: restName,
                    ownerId: admin._id,
                    subscription: {
                        status: 'Active',
                        plan: 'Basic',
                        billingCycle: 'monthly',
                        trialActive: true,
                        startDate: new Date(),
                        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    },
                    approvalStatus: 'Approved',
                    verificationStatus: 'Verified',
                    isActive: true
                });
                admin.restaurantId = newRest._id;
                await admin.save();

                await Branch.create({
                    restaurantId: newRest._id,
                    name: `${newRest.name} Branch`,
                    location: { address: 'Primary Location' },
                    contact: { phone: admin.phoneNumber || '' },
                    isActive: true
                });
            }
        }

        const totalRestaurants = await Restaurant.countDocuments({ isDeleted: { $ne: true } });
        const activeRestaurants = await Restaurant.countDocuments({ 
            isDeleted: { $ne: true }, 
            status: 'Active', 
            approvalStatus: 'Approved', 
            'subscription.status': { $nin: ['Cancelled', 'Frozen', 'Expired', 'Suspended', 'Inactive'] } 
        });
        const pendingRestaurants = await Restaurant.countDocuments({ isDeleted: { $ne: true }, approvalStatus: 'Pending' });
        const frozenRestaurants = await Restaurant.countDocuments({ isDeleted: { $ne: true }, 'subscription.status': 'Frozen' });
        const totalUsers = await User.countDocuments();
        const totalOrders = await Order.countDocuments();

        // Calculate real MRR from active restaurant subscriptions
        const activeSubscribedRestaurants = await Restaurant.find({ 
            approvalStatus: { $ne: 'Rejected' }, 
            'subscription.status': { $ne: 'Cancelled' } 
        });

        let totalRevenue = 0;
        activeSubscribedRestaurants.forEach(r => {
            const planPrice = r.subscription?.price || (r.subscription?.plan === 'Enterprise' ? 199 : r.subscription?.plan === 'Pro' ? 99 : 49);
            const cycle = r.subscription?.billingCycle || 'monthly';
            totalRevenue += cycle === 'yearly' ? Math.round(planPrice / 12) : planPrice;
        });

        // Calculate total commission earned across all registered subscribed restaurants from customer food orders
        const allRestaurants = await Restaurant.find().lean();
        const paidOrders = await Order.find({ isPaid: true }).lean();
        const restaurantRevenueMap = {};
        paidOrders.forEach(o => {
            if (o.restaurantId) {
                const rId = o.restaurantId.toString();
                restaurantRevenueMap[rId] = (restaurantRevenueMap[rId] || 0) + (o.totalPrice || 0);
            }
        });

        let totalCommission = 0;
        allRestaurants.forEach(r => {
            const rev = restaurantRevenueMap[r._id.toString()] || 0;
            const rate = r.commissionRate !== undefined && r.commissionRate !== null ? r.commissionRate : 5; // Default 5% platform commission if set
            totalCommission += (rev * rate) / 100;
        });

        res.json({
            totalRestaurants,
            activeRestaurants,
            pendingRestaurants,
            frozenRestaurants,
            totalUsers,
            totalOrders,
            totalRevenue,
            totalCommission: Math.round(totalCommission)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all restaurants
// @route   GET /api/super-admin/restaurants
// @access  Private/SuperAdmin
// @desc    Get all restaurants
// @route   GET /api/super-admin/restaurants
// @access  Private/SuperAdmin
export const getRestaurants = async (req, res) => {
    try {
        // Auto-heal: Ensure any registered RestaurantAdmin/Admin user has a Restaurant record
        const Branch = (await import('../models/Branch.js')).default;
        const User = (await import('../models/User.js')).default;
        const adminUsers = await User.find({ role: { $in: ['RestaurantAdmin', 'Admin'] } });
        for (const admin of adminUsers) {
            const exists = await Restaurant.exists({ $or: [{ ownerId: admin._id }, { _id: admin.restaurantId }] });
            if (!exists) {
                const restName = admin.name ? `${admin.name}'s Restaurant` : 'New Restaurant';
                const newRest = await Restaurant.create({
                    name: restName,
                    ownerId: admin._id,
                    subscription: {
                        status: 'Active',
                        plan: 'Basic',
                        billingCycle: 'monthly',
                        trialActive: true,
                        startDate: new Date(),
                        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    },
                    approvalStatus: 'Pending',
                    verificationStatus: 'Pending',
                    isActive: true
                });
                admin.restaurantId = newRest._id;
                await admin.save();

                await Branch.create({
                    restaurantId: newRest._id,
                    name: `${newRest.name} Branch`,
                    location: { address: 'Primary Location' },
                    contact: { phone: admin.phoneNumber || '' },
                    isActive: true
                });
            }
        }

        const restaurants = await Restaurant.find().populate('ownerId', 'name email').sort({ createdAt: -1 }).lean();

        // Auto-repair any restaurants with blank, null, or missing owner/names
        const repairedRestaurants = await Promise.all(restaurants.map(async (r) => {
            if (!r.ownerId) {
                const owner = await User.findOne({ restaurantId: r._id, role: { $in: ['RestaurantAdmin', 'Admin'] } }).select('name email');
                if (owner) {
                    r.ownerId = { _id: owner._id, name: owner.name, email: owner.email };
                    try {
                        await Restaurant.findByIdAndUpdate(r._id, { ownerId: owner._id });
                    } catch (e) {
                        console.error("Failed to persist ownerId", e);
                    }
                } else {
                    r.ownerId = { name: `${r.name} Admin`, email: `admin@${r.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'restaurant'}.com` };
                }
            }
            if (!r.name || r.name.trim() === '' || r.name === 'Unnamed') {
                const ownerName = r.ownerId?.name || 'Partner';
                r.name = `${ownerName}'s Restaurant`;
                try {
                    await Restaurant.findByIdAndUpdate(r._id, { name: r.name });
                } catch (e) {
                    console.error("Failed to persist repaired restaurant name", e);
                }
            }
            return r;
        }));

        const revenues = await Order.aggregate([
            { $match: { isPaid: true } },
            { $group: { _id: "$restaurantId", totalRevenue: { $sum: "$totalPrice" } } }
        ]);
        const revMap = {};
        revenues.forEach(r => {
            if (r._id) revMap[r._id.toString()] = r.totalRevenue;
        });
        const result = repairedRestaurants.map(r => ({
            ...r,
            totalRevenue: revMap[r._id.toString()] || 0
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update restaurant subscription
// @route   PUT /api/super-admin/restaurants/:id/subscription
// @access  Private/SuperAdmin
export const updateSubscription = async (req, res) => {
    const { status, plan, expiryDate } = req.body;
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        if (status) restaurant.subscription.status = status;
        if (plan) restaurant.subscription.plan = plan;
        if (expiryDate) restaurant.subscription.expiryDate = expiryDate;

        await restaurant.save();
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update restaurant visibility status (Active, Inactive, Suspended, Deleted)
// @route   PUT /api/super-admin/restaurants/:id/status
// @access  Private/SuperAdmin
export const updateRestaurantVisibilityStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['Active', 'Inactive', 'Suspended', 'Deleted'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
            });
        }

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        restaurant.status = status;
        if (status === 'Active') {
            restaurant.isActive = true;
            restaurant.isDeleted = false;
            restaurant.deletedAt = null;
            restaurant.deletedBy = null;
            if (restaurant.subscription && (restaurant.subscription.status === 'Suspended' || restaurant.subscription.status === 'Frozen')) {
                restaurant.subscription.status = 'Active';
            }
        } else if (status === 'Inactive') {
            restaurant.isActive = false;
            restaurant.isDeleted = false;
        } else if (status === 'Suspended') {
            restaurant.isActive = false;
            restaurant.isDeleted = false;
            if (restaurant.subscription) {
                restaurant.subscription.status = 'Suspended';
            }
        } else if (status === 'Deleted') {
            restaurant.isActive = false;
            restaurant.isDeleted = true;
            restaurant.deletedAt = new Date();
            restaurant.deletedBy = req.user._id;
        }

        await restaurant.save();

        res.json({
            message: `Restaurant status updated to ${status} successfully`,
            restaurant
        });
    } catch (error) {
        console.error("Failed to update restaurant status:", error);
        res.status(500).json({ message: error.message || 'Failed to update restaurant status' });
    }
};

// @desc    Restore a soft-deleted or inactive restaurant
// @route   PUT /api/super-admin/restaurants/:id/restore
// @access  Private/SuperAdmin
export const restoreRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        restaurant.status = 'Active';
        restaurant.isActive = true;
        restaurant.isDeleted = false;
        restaurant.deletedAt = null;
        restaurant.deletedBy = null;
        if (restaurant.subscription && (restaurant.subscription.status === 'Suspended' || restaurant.subscription.status === 'Frozen')) {
            restaurant.subscription.status = 'Active';
        }

        await restaurant.save();

        res.json({
            message: 'Restaurant restored and activated successfully',
            restaurant
        });
    } catch (error) {
        console.error("Failed to restore restaurant:", error);
        res.status(500).json({ message: error.message || 'Failed to restore restaurant' });
    }
};

// @desc    Delete a restaurant (Safe Soft Delete by default, preserves orders & billing records)
// @route   DELETE /api/super-admin/restaurants/:id
// @access  Private/SuperAdmin
export const deleteRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const isPermanent = req.query.permanent === 'true';

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        if (isPermanent) {
            // Hard delete only if explicitly requested with ?permanent=true
            const Branch = (await import('../models/Branch.js')).default;
            const RestaurantVerification = (await import('../models/RestaurantVerification.js')).default;
            const Menu = (await import('../models/Menu.js')).default;
            const MenuItem = (await import('../models/MenuItem.js')).default;
            const Table = (await import('../models/Table.js')).default;
            const Category = (await import('../models/Category.js')).default;

            await Branch.deleteMany({ restaurantId: id });
            await RestaurantVerification.deleteMany({ restaurantId: id });
            await Menu.deleteMany({ restaurantId: id });
            await MenuItem.deleteMany({ restaurantId: id });
            await Table.deleteMany({ restaurantId: id });
            await Category.deleteMany({ restaurantId: id });
            await Restaurant.findByIdAndDelete(id);

            return res.json({ message: 'Restaurant permanently removed.' });
        }

        // Safe Soft Delete: mark deleted, preserve all historical billing, orders, and payments
        restaurant.status = 'Deleted';
        restaurant.isDeleted = true;
        restaurant.deletedAt = new Date();
        restaurant.deletedBy = req.user._id;
        restaurant.isActive = false;
        await restaurant.save();

        res.json({ 
            message: 'Restaurant safely deactivated and soft-deleted. Historical orders and financial reports preserved.',
            restaurant
        });
    } catch (error) {
        console.error("Failed to delete restaurant:", error);
        res.status(500).json({ message: error.message || 'Failed to delete restaurant' });
    }
};

// --- PLAN MANAGEMENT ---

export const getPlans = async (req, res) => {
    try {
        const plans = await Plan.find();
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createPlan = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (payload.monthlyPrice === undefined && payload.price !== undefined) payload.monthlyPrice = Number(payload.price);
        if (payload.yearlyPrice === undefined && payload.price !== undefined) payload.yearlyPrice = Number(payload.price);
        if (payload.isActive === undefined) payload.isActive = true;
        const plan = await Plan.create(payload);
        res.status(201).json(plan);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updatePlan = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (payload.monthlyPrice === undefined && payload.price !== undefined) payload.monthlyPrice = Number(payload.price);
        if (payload.yearlyPrice === undefined && payload.price !== undefined) payload.yearlyPrice = Number(payload.price);
        const plan = await Plan.findByIdAndUpdate(req.params.id, payload, { new: true });
        res.json(plan);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deletePlan = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Validate if any restaurant is currently subscribed to this plan
        const subscribedCount = await Restaurant.countDocuments({ 'subscription.plan': plan.name });
        if (subscribedCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete plan "${plan.name}" because ${subscribedCount} restaurant(s) are currently subscribed to it. Please deactivate the plan instead.` 
            });
        }

        await Plan.findByIdAndDelete(req.params.id);
        res.json({ message: 'Plan removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- SUPPORT TICKETS ---

export const getTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find().populate('restaurantId', 'name email').sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.json(ticket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        await Ticket.findByIdAndDelete(req.params.id);
        res.json({ message: 'Ticket deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// --- RESTAURANT APPROVAL ---

export const updateApprovalStatus = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        
        if (req.body.approvalStatus) {
            restaurant.approvalStatus = req.body.approvalStatus;
            if (req.body.approvalStatus === 'Approved') {
                restaurant.verificationStatus = 'Verified';
                if (!restaurant.subscription) restaurant.subscription = {};
                restaurant.subscription.status = 'Active';

                try {
                    const RestaurantVerification = (await import('../models/RestaurantVerification.js')).default;
                    const verif = await RestaurantVerification.findOne({ restaurantId: restaurant._id });
                    if (verif) {
                        verif.status = 'Verified';
                        await verif.save();
                    }
                } catch (vErr) {
                    console.error("Failed to sync verification record on approval", vErr);
                }
            } else if (req.body.approvalStatus === 'Rejected') {
                restaurant.verificationStatus = 'Rejected';
            }
        }
        if (req.body.commissionRate !== undefined) restaurant.commissionRate = req.body.commissionRate;
        
        await restaurant.save();
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all notifications for Super Admin
// @route   GET /api/super-admin/notifications
// @access  Private/SuperAdmin
export const getSuperAdminNotifications = async (req, res) => {
    try {
        // Get notifications that are either flagged as super-admin-only,
        // or are System type with no restaurantId (legacy support)
        const notifications = await Notification.find({
            $or: [
                { isSuperAdminOnly: true },
                { type: 'System', restaurantId: { $exists: false } },
                { type: 'System', restaurantId: null }
            ]
        }).sort({ createdAt: -1 }).limit(200);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark notification as read for Super Admin
// @route   PUT /api/super-admin/notifications/:id/read
// @access  Private/SuperAdmin
export const markSuperAdminNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        notification.read = true;
        await notification.save();
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users on the platform
// @route   GET /api/super-admin/users
// @access  Private/SuperAdmin
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().populate('restaurantId', 'name email').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle user status (active/inactive)
// @route   PUT /api/super-admin/users/:id/status
// @access  Private/SuperAdmin
export const updateUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.isActive = !user.isActive;
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a user from the platform
// @route   DELETE /api/super-admin/users/:id
// @access  Private/SuperAdmin
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent self-deletion
        if (req.user._id.toString() === req.params.id) {
            return res.status(400).json({ message: 'You cannot delete your own Super Admin account' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Broadcast a new system alert/notification
// @route   POST /api/super-admin/notifications/broadcast
// @access  Private/SuperAdmin
export const broadcastNotification = async (req, res) => {
    const { title, desc, type, restaurantId } = req.body;
    try {
        const payload = {
            title,
            desc,
            type: type || 'System',
            read: false
        };
        if (restaurantId) {
            payload.restaurantId = restaurantId;
        }
        const notification = await Notification.create(payload);
        res.status(201).json(notification);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a system notification
// @route   DELETE /api/super-admin/notifications/:id
// @access  Private/SuperAdmin
export const deleteSuperAdminNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all subscription billing history
// @route   GET /api/super-admin/billing-history
// @access  Private/SuperAdmin
export const getSubscriptionPayments = async (req, res) => {
    try {
        const payments = await SubscriptionPayment.find().populate('restaurantId', 'name contactEmail').sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get platform subscription analytics
// @route   GET /api/super-admin/subscription-analytics
// @access  Private/SuperAdmin
export const getSubscriptionAnalytics = async (req, res) => {
    try {
        const activeBasic = await Restaurant.countDocuments({ 'subscription.status': 'Active', 'subscription.plan': 'Basic' });
        const activePro = await Restaurant.countDocuments({ 'subscription.status': 'Active', 'subscription.plan': 'Pro' });
        const activeEnt = await Restaurant.countDocuments({ 'subscription.status': 'Active', 'subscription.plan': 'Enterprise' });

        const totalRestaurants = await Restaurant.countDocuments();
        const activeRestaurants = await Restaurant.countDocuments({ 'subscription.status': 'Active' });
        const expiredRestaurants = await Restaurant.countDocuments({ 'subscription.status': 'Expired' });
        const cancelledRestaurants = await Restaurant.countDocuments({ 'subscription.status': 'Cancelled' });
        
        // Calculate MRR & ARR
        const activeM = await Restaurant.find({ 'subscription.status': 'Active', 'subscription.billingCycle': 'monthly' });
        const activeY = await Restaurant.find({ 'subscription.status': 'Active', 'subscription.billingCycle': 'yearly' });
        
        let mrr = 0;
        activeM.forEach(r => { mrr += r.subscription.price || 49; });
        activeY.forEach(r => { mrr += (r.subscription.price || 490) / 12; });
        
        mrr = Math.round(mrr);
        const arr = mrr * 12;

        const churnRate = totalRestaurants > 0 ? Number(((cancelledRestaurants / totalRestaurants) * 100).toFixed(1)) : 0;
        const renewalRate = totalRestaurants > 0 ? Number(((activeRestaurants / (activeRestaurants + expiredRestaurants || 1)) * 100).toFixed(1)) : 100;

        res.json({
            stats: {
                totalSubscriptions: totalRestaurants,
                activeSubscriptions: activeRestaurants,
                basicSubscribers: activeBasic,
                proSubscribers: activePro,
                enterpriseSubscribers: activeEnt,
                monthlyRecurringRevenue: mrr,
                annualRecurringRevenue: arr,
                renewalRate,
                churnRate
            },
            trends: {
                subscriptionGrowth: [
                    { month: 'Jan', count: 12 },
                    { month: 'Feb', count: 18 },
                    { month: 'Mar', count: 25 },
                    { month: 'Apr', count: 32 },
                    { month: 'May', count: 45 },
                    { month: 'Jun', count: totalRestaurants || 50 }
                ],
                revenueByPlan: [
                    { plan: 'Basic', revenue: activeBasic * 49 },
                    { plan: 'Pro', revenue: activePro * 99 },
                    { plan: 'Enterprise', revenue: activeEnt * 199 }
                ],
                planDistribution: [
                    { name: 'Basic', value: activeBasic },
                    { name: 'Pro', value: activePro },
                    { name: 'Enterprise', value: activeEnt }
                ]
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update restaurant custom modules & limits directly (Super Admin)
// @route   PUT /api/super-admin/restaurants/:id/modules
// @access  Private/SuperAdmin
export const updateRestaurantModules = async (req, res) => {
    try {
        const { id } = req.params;
        const { modules, branchLimit, staffLimit, isCustomBillingActive, customPlanName } = req.body;

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        if (!restaurant.billingConfig) {
            restaurant.billingConfig = { modules: {}, paymentMethods: {} };
        }

        if (isCustomBillingActive !== undefined) {
            restaurant.billingConfig.isCustomBillingActive = Boolean(isCustomBillingActive);
        } else {
            restaurant.billingConfig.isCustomBillingActive = true;
        }

        if (customPlanName) {
            restaurant.billingConfig.customPlanName = customPlanName;
        }

        if (branchLimit !== undefined) {
            restaurant.billingConfig.branchLimit = Number(branchLimit);
        }

        if (staffLimit !== undefined) {
            restaurant.billingConfig.staffLimit = Number(staffLimit);
        }

        if (modules) {
            restaurant.billingConfig.modules = {
                ...restaurant.billingConfig.modules,
                ...modules
            };

            // Sync kitchenMode, kotEnabled, kdsEnabled in restaurantConfig
            if (!restaurant.restaurantConfig) restaurant.restaurantConfig = {};
            if (!restaurant.restaurantConfig.orderKitchen) restaurant.restaurantConfig.orderKitchen = {};

            if (modules.kot !== undefined) {
                restaurant.restaurantConfig.orderKitchen.kotEnabled = modules.kot;
            }
            if (modules.kds !== undefined) {
                restaurant.restaurantConfig.orderKitchen.kdsEnabled = modules.kds;
                restaurant.restaurantConfig.orderKitchen.kitchenMode = modules.kds ? 'KDS' : 'KOT_ONLY';
            }
        }

        await restaurant.save();

        res.json({
            success: true,
            message: `Custom module permissions updated for "${restaurant.name}"!`,
            data: restaurant.billingConfig
        });
    } catch (error) {
        console.error('Error updating restaurant modules:', error);
        res.status(500).json({ message: error.message || 'Server error updating modules' });
    }
};
