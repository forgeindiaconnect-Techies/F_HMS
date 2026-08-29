import Order from '../models/Order.js';
import mongoose from 'mongoose';
import { broadcastToRestaurant, broadcastToCustomerOrder } from '../config/websocket.js';

const sanitizeOrderItems = (items) => {
    if (!items) return items;
    return items.map(item => {
        const sanitizedItem = { ...item };
        if (sanitizedItem.product && !mongoose.Types.ObjectId.isValid(sanitizedItem.product)) {
            delete sanitizedItem.product;
        }
        return sanitizedItem;
    });
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Customer/Waiter)
export const addOrderItems = async (req, res) => {
    const { orderItems, orderType, source, restaurantId, branchId, paymentMethod, subscriptionPlan, taxPrice, totalPrice, tableNumber, notes } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400).json({ message: 'No order items' });
        return;
    } else {
        let finalBranchId = (branchId && mongoose.Types.ObjectId.isValid(branchId)) ? branchId : (req.user ? req.user.branchId : null);
        let finalRestaurantId = (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) ? restaurantId : (req.user ? req.user.restaurantId : null);

        // If the user is an owner/admin testing the system and doesn't have a branchId, 
        // fallback to the first branch of the restaurant so schema validation doesn't fail
        if (!finalBranchId && finalRestaurantId) {
            const Branch = mongoose.model('Branch');
            const firstBranch = await Branch.findOne({ restaurantId: finalRestaurantId });
            if (firstBranch) {
                finalBranchId = firstBranch._id;
            }
        }

        // Ultimate fallback for manually created local test users who have NO restaurantId or branchId
        if (!finalRestaurantId || !finalBranchId) {
            const Restaurant = mongoose.model('Restaurant');
            const Branch = mongoose.model('Branch');
            const firstRestaurant = await Restaurant.findOne();
            const firstBranch = await Branch.findOne();
            if (firstRestaurant) finalRestaurantId = firstRestaurant._id;
            if (firstBranch) finalBranchId = firstBranch._id;
        }

        let finalUserId = req.user ? req.user._id : null;
        if (!finalUserId) {
            const User = mongoose.model('User');
            let guestUser = await User.findOne({ role: 'Customer' });
            if (!guestUser) {
                guestUser = await User.findOne();
            }
            if (guestUser) finalUserId = guestUser._id;
        }

        const deliveryOtp = (orderType === 'Delivery') 
            ? Math.floor(1000 + Math.random() * 9000).toString() 
            : null;

        const order = new Order({
            orderItems: sanitizeOrderItems(orderItems),
            user: finalUserId,
            restaurantId: finalRestaurantId,
            branchId: finalBranchId,
            orderType,
            tableNumber,
            notes,
            source,
            paymentMethod,
            subscriptionPlan: subscriptionPlan || 'One-time Order',
            taxPrice,
            totalPrice,
            deliveryOtp,
            isPaid: false, // Will be paid later or by cashier
            statusHistory: [{
                status: 'Pending',
                timestamp: Date.now()
            }]
        });

        const createdOrder = await order.save();

        // Update table occupancy status if Dine In
        if (orderType === 'Dine In' && tableNumber) {
            try {
                const Table = mongoose.model('Table');
                const table = await Table.findOne({
                    tableNumber,
                    restaurantId: finalRestaurantId,
                    branchId: finalBranchId
                });
                if (table) {
                    table.status = 'Occupied';
                    table.activeOrder = createdOrder._id;
                    table.customers = Math.max(table.customers, 1);
                    await table.save();
                }
            } catch (tableErr) {
                console.error('Failed to set table status to Occupied', tableErr);
            }
        }

        // Create a notification for the chef
        try {
            const Notification = (await import('../models/Notification.js')).default;
            await Notification.create({
                title: `New Dine-In Order: Table ${tableNumber || 'Any'}`,
                desc: `${orderItems.map(i => `${i.qty}x ${i.name}`).join(', ')}`,
                type: 'Order',
                restaurantId: finalRestaurantId,
                read: false
            });
        } catch (notifErr) {
            console.error('Failed to create order notification', notifErr);
        }

        // Broadcast real-time websocket alert to kitchen display
        broadcastToRestaurant(finalRestaurantId, 'new_order', createdOrder);

        res.status(201).json(createdOrder);
    }
};

// @desc    Append items to an existing active order (Modify Order)
// @route   PUT /api/orders/:id/items
// @access  Private (Staff)
export const appendOrderItems = async (req, res) => {
    const { orderItems, totalPrice, taxPrice, notes } = req.body;
    
    if (orderItems && orderItems.length === 0) {
        res.status(400).json({ message: 'No new order items provided' });
        return;
    }
    
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            order.orderItems.push(...sanitizeOrderItems(orderItems));
            // Recalculate total price
            order.totalPrice += totalPrice;
            if (taxPrice) order.taxPrice += taxPrice;
            
            if (notes) {
                order.notes = order.notes ? `${order.notes}\n${notes}` : notes;
            }
            
            // If the order was already completed/ready, we might want to change it back to Preparing
            // But usually this means printing a new kitchen ticket. For now, let's just save.
            order.status = 'Preparing';
            
            const updatedOrder = await order.save();

            // Create a notification for the chef
            try {
                const Notification = (await import('../models/Notification.js')).default;
                await Notification.create({
                    title: `Items Added: Table ${order.tableNumber || 'Any'}`,
                    desc: `${orderItems.map(i => `${i.qty}x ${i.name}`).join(', ')}`,
                    type: 'Order',
                    restaurantId: order.restaurantId,
                    read: false
                });
            } catch (notifErr) {
                console.error('Failed to create order append notification', notifErr);
            }

            // Broadcast order updates to kitchen & customers
            broadcastToRestaurant(order.restaurantId, 'order_updated', updatedOrder);
            broadcastToCustomerOrder(order._id, 'order_status_updated', updatedOrder);

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
    const order = await Order.findById(req.params.id)
        .populate('user', 'name email')
        .populate('deliveryPartner', 'name email phoneNumber');

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
    const orders = await Order.find({ user: req.user._id })
        .populate('restaurantId', 'name deliverySettings')
        .populate({
            path: 'deliveryPartner',
            select: 'name phoneNumber vehicleDetails status'
        })
        .sort({ createdAt: -1 });
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
    } else if (req.user && req.user.role !== 'SuperAdmin') {
        return res.json([]);
    }

    console.log('GET /api/orders called. User:', req.user?._id, 'Role:', req.user?.role, 'branchId:', req.user?.branchId, 'restaurantId:', req.user?.restaurantId);
    console.log('Constructed filter:', filter);

    const orders = await Order.find(filter)
        .populate('user', 'id name')
        .populate('deliveryPartner', 'id name')
        .sort({ createdAt: -1 });
    res.json(orders);
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Staff)
export const updateOrderStatus = async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        const oldStatus = order.status;
        const newStatus = req.body.status || order.status;
        
        if (newStatus !== oldStatus) {
            order.status = newStatus;
            order.statusHistory.push({
                status: newStatus,
                timestamp: Date.now(),
                updatedBy: req.user ? req.user._id : null
            });

            if (newStatus === 'Ready') {
                // Delivery partner notification
                if (order.orderType === 'Delivery' && order.deliveryPartner) {
                    try {
                        const Notification = (await import('../models/Notification.js')).default;
                        await Notification.create({
                            title: `Delivery Order Ready`,
                            desc: `Order #${order._id.toString().substring(order._id.toString().length - 4).toUpperCase()} is prepared. Pick it up from the kitchen.`,
                            type: 'Order',
                            restaurantId: order.restaurantId,
                            read: false
                        });
                    } catch (err) {
                        console.error('Failed to create delivery partner notification', err);
                    }
                }
            }

            if (newStatus === 'Ready for Pickup') {
                // Waiter notification
                try {
                    const Notification = (await import('../models/Notification.js')).default;
                    await Notification.create({
                        title: `Counter Transfer Required`,
                        desc: `Order #${order._id.toString().substring(order._id.toString().length - 4).toUpperCase()} is ready. Move to counter.`,
                        type: 'Order',
                        restaurantId: order.restaurantId,
                        read: false
                    });
                } catch (err) {
                    console.error('Failed to create waiter notification', err);
                }

                // Customer notification
                try {
                    const Notification = (await import('../models/Notification.js')).default;
                    await Notification.create({
                        title: `Self-Pickup Order Ready`,
                        desc: `Your order is ready. Please collect it from the Pickup Counter.`,
                        type: 'Order',
                        restaurantId: order.restaurantId,
                        userId: order.user,
                        read: false
                    });
                } catch (err) {
                    console.error('Failed to create customer notification', err);
                }
            }

            if (newStatus === 'Completed') {
                order.pickupTime = Date.now();
                if (order.orderType === 'Self-Pickup' || order.orderType === 'Self Pickup') {
                    order.isPaid = true;
                    order.paidAt = Date.now();
                }

                // Clean up table occupancy if Dine In
                if (order.orderType === 'Dine In') {
                    try {
                        const Table = mongoose.model('Table');
                        const table = await Table.findOne({
                            tableNumber: order.tableNumber,
                            restaurantId: order.restaurantId,
                            branchId: order.branchId
                        });
                        if (table) {
                            table.status = 'Available';
                            table.customers = 0;
                            table.activeOrder = null;
                            await table.save();
                        }
                    } catch (err) {
                        console.error('Failed to clear table status', err);
                    }
                }
            }
        }

        const updatedOrder = await order.save();
        
        // Broadcast status update to customer tracking
        broadcastToCustomerOrder(order._id, 'order_status_updated', updatedOrder);
        
        // Broadcast general update to kitchen & waiters
        broadcastToRestaurant(order.restaurantId, 'order_updated', updatedOrder);
        
        if (updatedOrder.status === 'Ready' || updatedOrder.status === 'Ready for Pickup') {
            broadcastToRestaurant(order.restaurantId, 'ready_to_serve', updatedOrder);
        }
        
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
        order.status = 'Delivered';
        
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

        // Also update table status if it's a Dine In order
        if (order.orderType === 'Dine In') {
            try {
                const mongoose = await import('mongoose');
                const Table = mongoose.model('Table');
                const table = await Table.findOne({ 
                    tableNumber: order.tableNumber, 
                    restaurantId: order.restaurantId,
                    branchId: order.branchId
                });
                if (table) {
                    table.status = 'Available';
                    table.customers = 0;
                    table.activeOrder = null;
                    await table.save();
                }
            } catch (tableErr) {
                console.error('Failed to reset table status on pay', tableErr);
            }
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Merge source order into target order
// @route   POST /api/orders/merge
// @access  Private (Cashier)
export const mergeOrders = async (req, res) => {
    const { sourceOrderId, targetOrderId } = req.body;

    try {
        const sourceOrder = await Order.findById(sourceOrderId);
        const targetOrder = await Order.findById(targetOrderId);

        if (!sourceOrder || !targetOrder) {
            return res.status(404).json({ message: 'One or both orders not found' });
        }

        // Push source order items into target order
        targetOrder.orderItems.push(...sourceOrder.orderItems);
        targetOrder.totalPrice += sourceOrder.totalPrice;
        targetOrder.taxPrice += sourceOrder.taxPrice;
        targetOrder.notes = targetOrder.notes 
            ? `${targetOrder.notes}\nMerged from table ${sourceOrder.tableNumber || 'Any'}` 
            : `Merged from table ${sourceOrder.tableNumber || 'Any'}`;

        await targetOrder.save();

        // Release the source table
        if (sourceOrder.orderType === 'Dine In' && sourceOrder.tableNumber) {
            const Table = mongoose.model('Table');
            const table = await Table.findOne({
                tableNumber: sourceOrder.tableNumber,
                restaurantId: sourceOrder.restaurantId,
                branchId: sourceOrder.branchId
            });
            if (table) {
                table.status = 'Available';
                table.customers = 0;
                table.activeOrder = null;
                await table.save();
            }
        }

        // Delete the source order
        await Order.findByIdAndDelete(sourceOrderId);

        res.json({ message: 'Orders merged successfully', mergedOrder: targetOrder });
    } catch (error) {
        res.status(500).json({ message: 'Failed to merge orders', error: error.message });
    }
};

// @desc    Refund transaction
// @route   PUT /api/orders/:id/refund
// @access  Private (Cashier)
export const refundOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = 'Refunded';
        order.paymentMethod = 'Refunded';
        order.isPaid = false;
        
        await order.save();
        res.json({ message: 'Order refunded successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Refund failed', error: error.message });
    }
};

// @desc    Create Razorpay Order for Customer Checkout
// @route   POST /api/orders/razorpay-order
// @access  Public / Customer
export const createRazorpayCustomerOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', restaurantId } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid payment amount is required.' });
        }

        const Razorpay = (await import('razorpay')).default;
        const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SlbQBi57McKtUc';
        const keySecret = process.env.RAZORPAY_KEY_SECRET || 'IgfxpfmQCMxSPaU0T4EyhcLU';

        const instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const razorpayOrder = await instance.orders.create({
            amount: Math.round(amount * 100), // in paise
            currency: currency,
            receipt: `food_${Date.now().toString().slice(-8)}`,
            notes: {
                restaurantId: restaurantId || '',
                type: 'Customer Food Order'
            }
        });

        res.json({
            orderId: razorpayOrder.id,
            amount: amount,
            amountPaise: Math.round(amount * 100),
            currency: currency,
            keyId: keyId
        });
    } catch (error) {
        console.error('Razorpay Customer Order Error:', error);
        res.status(400).json({ message: error.message || 'Failed to create Razorpay payment order' });
    }
};

// @desc    Verify Razorpay Payment and Mark Customer Order as Paid
// @route   POST /api/orders/razorpay-verify
// @access  Public / Customer
export const verifyRazorpayCustomerPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, paymentMethod } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing Razorpay signature verification parameters.' });
        }

        const crypto = (await import('crypto')).default;
        const keySecret = process.env.RAZORPAY_KEY_SECRET || 'IgfxpfmQCMxSPaU0T4EyhcLU';

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Razorpay payment signature verification failed.' });
        }

        if (orderId) {
            const order = await Order.findById(orderId);
            if (order) {
                order.isPaid = true;
                order.paidAt = new Date();
                order.paymentMethod = paymentMethod || 'Razorpay UPI';
                order.paymentResult = {
                    id: razorpay_payment_id,
                    status: 'captured',
                    update_time: new Date().toISOString()
                };
                await order.save();

                // Broadcast real-time order update
                broadcastToRestaurant(order.restaurantId, 'order_updated', order);
                broadcastToCustomerOrder(order._id, 'order_status_updated', order);

                return res.json({ success: true, message: 'Payment verified and order updated!', order });
            }
        }

        res.json({ success: true, message: 'Razorpay payment verified successfully!', paymentId: razorpay_payment_id });
    } catch (error) {
        console.error('Razorpay Customer Payment Verification Error:', error);
        res.status(400).json({ message: error.message || 'Payment verification failed' });
    }
};

