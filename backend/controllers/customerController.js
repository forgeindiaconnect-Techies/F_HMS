import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';

// @desc    Get all customers with aggregated stats for a restaurant
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res) => {
    try {
        const { restaurantId } = req.user;

        if (!restaurantId) {
            return res.json([]);
        }

        // Find customer IDs who have placed orders at this restaurant
        const orderCustomerIds = await Order.distinct('user', {
            restaurantId: new mongoose.Types.ObjectId(restaurantId),
            user: { $exists: true, $ne: null }
        });

        // Fetch only customers who have ordered from this restaurant OR belong to this restaurant
        const customers = await User.find({
            role: 'Customer',
            $or: [
                { _id: { $in: orderCustomerIds } },
                { restaurantId: restaurantId }
            ]
        }).select('name email phoneNumber createdAt');

        // Aggregate order stats per customer specifically for this restaurant
        const orderStats = await Order.aggregate([
            { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId), user: { $exists: true, $ne: null } } },
            { 
                $group: {
                    _id: "$user",
                    visits: { $sum: 1 },
                    totalSpend: { $sum: "$totalPrice" },
                    lastVisit: { $max: "$createdAt" }
                }
            }
        ]);

        const statsMap = {};
        orderStats.forEach(stat => {
            if (stat._id) {
                statsMap[stat._id.toString()] = stat;
            }
        });

        const customerData = customers.map(customer => {
            const stats = statsMap[customer._id.toString()] || { visits: 0, totalSpend: 0, lastVisit: customer.createdAt };
            
            // Determine Tier
            let tier = 'Bronze';
            if (stats.totalSpend >= 1000) tier = 'Platinum';
            else if (stats.totalSpend >= 500) tier = 'Gold';
            else if (stats.totalSpend >= 100) tier = 'Silver';

            return {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phoneNumber || 'N/A',
                visits: stats.visits,
                totalSpend: stats.totalSpend,
                lastVisit: stats.lastVisit,
                tier: tier
            };
        });

        res.json(customerData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a new customer profile
// @route   POST /api/customers
// @access  Private
export const createCustomer = async (req, res) => {
    const { name, email, phone } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'A user with this email already exists' });
        }

        const user = await User.create({
            name,
            email,
            password: 'password123',
            role: 'Customer',
            restaurantId: req.user.restaurantId,
            phoneNumber: phone
        });

        res.status(201).json({
            id: user._id,
            name: user.name,
            email: user.email,
            phone: phone || 'N/A',
            visits: 0,
            totalSpend: 0,
            tier: 'Bronze',
            lastVisit: user.createdAt
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
