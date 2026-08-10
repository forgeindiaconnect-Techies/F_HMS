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
        const totalRestaurants = await Restaurant.countDocuments();
        const activeRestaurants = await Restaurant.countDocuments({ approvalStatus: 'Approved', 'subscription.status': 'Active' });
        const pendingRestaurants = await Restaurant.countDocuments({ approvalStatus: 'Pending' });
        const frozenRestaurants = await Restaurant.countDocuments({ 'subscription.status': 'Frozen' });
        const totalUsers = await User.countDocuments();
        const totalOrders = await Order.countDocuments();

        // Calculate total revenue from all paid orders
        const revenueAggregation = await Order.aggregate([
            { $match: { isPaid: true } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } }
        ]);
        const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

        res.json({
            totalRestaurants,
            activeRestaurants,
            pendingRestaurants,
            frozenRestaurants,
            totalUsers,
            totalOrders,
            totalRevenue
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all restaurants
// @route   GET /api/super-admin/restaurants
// @access  Private/SuperAdmin
export const getRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find().populate('ownerId', 'name email');
        res.json(restaurants);
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

// @desc    Delete a restaurant
// @route   DELETE /api/super-admin/restaurants/:id
// @access  Private/SuperAdmin
export const deleteRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        await Restaurant.findByIdAndDelete(req.params.id);
        res.json({ message: 'Restaurant deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
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

// --- RESTAURANT APPROVAL ---

export const updateApprovalStatus = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        
        if (req.body.approvalStatus) restaurant.approvalStatus = req.body.approvalStatus;
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
        const notifications = await Notification.find({ type: 'System' }).sort({ createdAt: -1 });
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
