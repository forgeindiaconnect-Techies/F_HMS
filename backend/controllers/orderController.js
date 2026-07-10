import Order from '../models/Order.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Customer/Waiter)
export const addOrderItems = async (req, res) => {
    const { orderItems, orderType, source, restaurantId, branchId, paymentMethod, taxPrice, totalPrice } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400).json({ message: 'No order items' });
        return;
    } else {
        let finalBranchId = branchId || (req.user ? req.user.branchId : null);
        let finalRestaurantId = restaurantId || (req.user ? req.user.restaurantId : null);

        // If the user is an owner/admin testing the system and doesn't have a branchId, 
        // fallback to the first branch of the restaurant so schema validation doesn't fail
        if (!finalBranchId && finalRestaurantId) {
            const mongoose = await import('mongoose');
            const Branch = mongoose.model('Branch');
            const firstBranch = await Branch.findOne({ restaurantId: finalRestaurantId });
            if (firstBranch) {
                finalBranchId = firstBranch._id;
            }
        }

        // Ultimate fallback for manually created local test users who have NO restaurantId or branchId
        if (!finalRestaurantId || !finalBranchId) {
            const mongoose = await import('mongoose');
            const Restaurant = mongoose.model('Restaurant');
            const Branch = mongoose.model('Branch');
            const firstRestaurant = await Restaurant.findOne();
            const firstBranch = await Branch.findOne();
            if (firstRestaurant) finalRestaurantId = firstRestaurant._id;
            if (firstBranch) finalBranchId = firstBranch._id;
        }

        let finalUserId = req.user ? req.user._id : null;
        if (!finalUserId) {
            const mongoose = await import('mongoose');
            const User = mongoose.model('User');
            let guestUser = await User.findOne({ role: 'Customer' });
            if (!guestUser) {
                guestUser = await User.findOne();
            }
            if (guestUser) finalUserId = guestUser._id;
        }

        const order = new Order({
            orderItems,
            user: finalUserId,
            restaurantId: finalRestaurantId,
            branchId: finalBranchId,
            orderType,
            tableNumber,
            notes,
            source,
            paymentMethod,
            taxPrice,
            totalPrice,
            isPaid: false // Will be paid later or by cashier
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);
    }
};

// @desc    Append items to an existing active order (Modify Order)
// @route   PUT /api/orders/:id/items
// @access  Private (Staff)
export const appendOrderItems = async (req, res) => {
    const { orderItems, totalPrice, taxPrice } = req.body;
    
    if (orderItems && orderItems.length === 0) {
        res.status(400).json({ message: 'No new order items provided' });
        return;
    }
    
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            order.orderItems.push(...orderItems);
            // Recalculate total price
            order.totalPrice += totalPrice;
            if (taxPrice) order.taxPrice += taxPrice;
            
            // If the order was already completed/ready, we might want to change it back to Preparing
            // But usually this means printing a new kitchen ticket. For now, let's just save.
            order.status = 'Preparing';
            
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to append items' });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
        res.json(order);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (Admin/Manager/Chef/Waiter/Cashier)
export const getOrders = async (req, res) => {
    // Optionally filter by status
    const status = req.query.status;
    const filter = status ? { status: { $in: status.split(',') } } : {};
    
    // Also optionally filter by paid status for Cashier
    if (req.query.isPaid !== undefined) {
        filter.isPaid = req.query.isPaid === 'true';
    }

    // Filter by branchId for staff members, or restaurantId for admin
    if (req.user && req.user.branchId) {
        filter.branchId = req.user.branchId;
    } else if (req.user && req.user.restaurantId) {
        filter.restaurantId = req.user.restaurantId;
    }

    const orders = await Order.find(filter).populate('user', 'id name').sort({ createdAt: -1 });
    res.json(orders);
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Staff)
export const updateOrderStatus = async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.status = req.body.status || order.status;
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private (Cashier)
export const updateOrderToPaid = async (req, res) => {
    const { paymentMethod, taxPrice, totalPrice } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        
        if (paymentMethod) order.paymentMethod = paymentMethod;
        if (taxPrice !== undefined) order.taxPrice = taxPrice;
        if (totalPrice !== undefined) order.totalPrice = totalPrice;

        // Payment result would normally come from Stripe/PayPal
        order.paymentResult = {
            id: 'mock_payment_id',
            status: 'completed',
            update_time: Date.now(),
            email_address: 'mock@example.com'
        };

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};
