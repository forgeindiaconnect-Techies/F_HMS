import User from '../models/User.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import DeliveryWithdrawal from '../models/DeliveryWithdrawal.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import jwt from 'jsonwebtoken';

// Helper to generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkey123', {
        expiresIn: '30d',
    });
};

// ─── AUTHENTICATION ─────────────────────────────────────────────────────────

// @desc    Send OTP to mobile number
// @route   POST /api/auth/delivery/send-otp
// @access  Public
export const sendOtp = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        const cleanPhone = String(phoneNumber).replace(/\D/g, '');
        const last10Digits = cleanPhone.slice(-10);

        console.log(`[OTP Request] Input Phone: "${phoneNumber}" | Normalized: "${last10Digits}"`);

        // Find user by phoneNumber suffix with DeliveryPartner role
        const user = await User.findOne({ 
            phoneNumber: { $regex: last10Digits + '$' }, 
            role: 'DeliveryPartner' 
        });
        
        if (!user) {
            return res.status(404).json({ message: 'Delivery partner not registered. Please contact restaurant admin.' });
        }

        // Simulate sending OTP (always 1234 for testing convenience)
        console.log(`[OTP Sent] To: ${phoneNumber} | OTP: 1234`);
        res.json({ message: 'OTP sent successfully (Simulated: Use code 1234)', phoneNumber });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP and log in
// @route   POST /api/auth/delivery/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;
        if (!phoneNumber || !otp) {
            return res.status(400).json({ message: 'Phone number and OTP are required' });
        }

        if (otp !== '1234') {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const cleanPhone = String(phoneNumber).replace(/\D/g, '');
        const last10Digits = cleanPhone.slice(-10);

        const user = await User.findOne({ 
            phoneNumber: { $regex: last10Digits + '$' }, 
            role: 'DeliveryPartner' 
        });
        
        if (!user) {
            return res.status(404).json({ message: 'Delivery partner not found' });
        }

        const partnerProfile = await DeliveryPartner.findOne({ userId: user._id });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            restaurantId: user.restaurantId,
            profile: partnerProfile,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── PARTNER ACTIONS ────────────────────────────────────────────────────────

// @desc    Get delivery partner profile
// @route   GET /api/delivery/profile
// @access  Private (DeliveryPartner)
export const getDeliveryProfile = async (req, res) => {
    try {
        const partner = await DeliveryPartner.findOne({ userId: req.user._id }).populate('userId', 'name email phoneNumber');
        if (!partner) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json(partner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle partner status (Online/Offline)
// @route   PUT /api/delivery/profile/status
// @access  Private (DeliveryPartner)
export const togglePartnerStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Online', 'Offline'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const partner = await DeliveryPartner.findOne({ userId: req.user._id });
        if (!partner) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        if (partner.verificationStatus !== 'Approved') {
            return res.status(403).json({ message: 'Your account is not approved yet.' });
        }

        partner.status = status;
        await partner.save();

        res.json(partner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get assigned orders
// @route   GET /api/delivery/orders/assigned
// @access  Private (DeliveryPartner)
export const getAssignedOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            deliveryPartner: req.user._id,
            deliveryStatus: { $in: ['Pending Assignment', 'Accepted', 'Picked Up', 'On the Way'] }
        }).sort({ updatedAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order delivery status
// @route   PUT /api/delivery/orders/:id/status
// @access  Private (DeliveryPartner)
export const updateOrderDeliveryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Accepted', 'Rejected', 'Picked Up', 'On the Way', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status update' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (String(order.deliveryPartner) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized for this order' });
        }

        order.deliveryStatus = status;

        if (status === 'Accepted') {
            order.status = 'Out for Delivery';
        } else if (status === 'Picked Up') {
            order.status = 'Out for Delivery';
        } else if (status === 'On the Way') {
            order.status = 'Out for Delivery';
        } else if (status === 'Delivered') {
            // Ensure delivery OTP exists
            if (!order.deliveryOtp) {
                order.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
            }

            const inputOtp = String(req.body.otp || '').trim();
            const expectedOtp = String(order.deliveryOtp).trim();

            if (!inputOtp || inputOtp !== expectedOtp) {
                return res.status(400).json({ 
                    message: `Invalid Delivery OTP. Please ask the customer for the correct OTP.` 
                });
            }

            order.status = 'Delivered';
            order.isPaid = true;
            order.paidAt = new Date();

            // Payout Earnings to Delivery Partner's Wallet!
            const partner = await DeliveryPartner.findOne({ userId: req.user._id });
            if (partner) {
                const charge = order.deliveryCharge || 30;
                partner.walletBalance += charge;
                partner.earnings += charge;
                await partner.save();
            }
        } else if (status === 'Rejected' || status === 'Cancelled') {
            order.deliveryStatus = 'Cancelled';
            order.deliveryPartner = null;
        }

        await order.save();

        // Socket emission to trigger updates in real-time
        if (req.app.get('socketio')) {
            const io = req.app.get('socketio');
            io.emit('order_status_updated', order);
            io.emit('delivery_partner_event', { orderId: order._id, status, partnerId: req.user._id });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create withdrawal request
// @route   POST /api/delivery/withdrawals
// @access  Private (DeliveryPartner)
export const createWithdrawalRequest = async (req, res) => {
    try {
        const { amount, payoutDetails } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const partner = await DeliveryPartner.findOne({ userId: req.user._id });
        if (!partner) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        if (partner.walletBalance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const withdrawal = await DeliveryWithdrawal.create({
            partnerId: partner._id,
            amount,
            payoutDetails
        });

        // Deduct from wallet instantly
        partner.walletBalance -= amount;
        await partner.save();

        res.status(201).json(withdrawal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get withdrawals list
// @route   GET /api/delivery/withdrawals
// @access  Private (DeliveryPartner)
export const getWithdrawalRequests = async (req, res) => {
    try {
        const partner = await DeliveryPartner.findOne({ userId: req.user._id });
        if (!partner) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        const withdrawals = await DeliveryWithdrawal.find({ partnerId: partner._id }).sort({ createdAt: -1 });
        res.json(withdrawals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get earnings history & stats
// @route   GET /api/delivery/earnings
// @access  Private (DeliveryPartner)
export const getEarningsHistory = async (req, res) => {
    try {
        const partner = await DeliveryPartner.findOne({ userId: req.user._id });
        if (!partner) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        const completedOrders = await Order.find({
            deliveryPartner: req.user._id,
            deliveryStatus: 'Delivered'
        }).sort({ updatedAt: -1 });

        // Calculate stats
        const totalDeliveries = completedOrders.length;
        const totalEarnings = partner.earnings;
        const walletBalance = partner.walletBalance;

        res.json({
            stats: {
                totalDeliveries,
                totalEarnings,
                walletBalance
            },
            history: completedOrders
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── ADMIN ACTIONS ──────────────────────────────────────────────────────────

// @desc    Get all delivery partners for admin
// @route   GET /api/delivery-partners
// @access  Private (Admin/Manager)
export const getDeliveryPartners = async (req, res) => {
    try {
        const partners = await DeliveryPartner.find({ restaurantId: req.user.restaurantId })
            .populate('userId', 'name email phoneNumber isActive');
        res.json(partners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Manually add delivery partner
// @route   POST /api/delivery-partners
// @access  Private (Admin/Manager)
export const addDeliveryPartner = async (req, res) => {
    try {
        const { 
            name, email, phoneNumber, vehicleType, vehicleModel, 
            rcNumber, licenseNumber, profilePhoto, drivingLicense, idProof 
        } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create User
        const user = await User.create({
            name,
            email,
            phoneNumber,
            role: 'DeliveryPartner',
            password: 'password123', // Default credentials
            restaurantId: req.user.restaurantId
        });

        // Create Delivery Partner Profile
        const partner = await DeliveryPartner.create({
            userId: user._id,
            restaurantId: req.user.restaurantId,
            verificationStatus: 'Approved', // Auto-approved when added by admin
            vehicleDetails: {
                type: vehicleType || 'Bike',
                model: vehicleModel || '',
                rcNumber: rcNumber || '',
                licenseNumber: licenseNumber || ''
            },
            documents: {
                profilePhoto: profilePhoto || '',
                drivingLicense: drivingLicense || '',
                aadhaarProof: idProof || ''
            }
        });

        // Automatically enable delivery settings on the restaurant
        const restaurantDoc = await Restaurant.findById(req.user.restaurantId);
        if (restaurantDoc) {
            if (!restaurantDoc.deliverySettings) {
                restaurantDoc.deliverySettings = { enabled: true };
            } else {
                restaurantDoc.deliverySettings.enabled = true;
            }
            await restaurantDoc.save();
        }

        res.status(201).json(partner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle delivery partner active status (Active/Inactive)
// @route   PUT /api/delivery/partners/:id/toggle-active
// @access  Private (Admin/Manager)
export const togglePartnerActiveStatus = async (req, res) => {
    try {
        const partner = await DeliveryPartner.findById(req.params.id);
        if (!partner) {
            return res.status(404).json({ message: 'Delivery partner profile not found' });
        }

        const user = await User.findById(partner.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({ message: `Partner is now ${user.isActive ? 'Active' : 'Inactive'}`, isActive: user.isActive });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update partner status (Approve/Reject/Suspend)
// @route   PUT /api/delivery-partners/:id/status
// @access  Private (Admin/Manager)
export const updatePartnerVerificationStatus = async (req, res) => {
    try {
        const { verificationStatus } = req.body;
        if (!['Pending', 'Approved', 'Rejected', 'Suspended'].includes(verificationStatus)) {
            return res.status(400).json({ message: 'Invalid verification status' });
        }

        const partner = await DeliveryPartner.findById(req.params.id);
        if (!partner) {
            return res.status(404).json({ message: 'Delivery partner profile not found' });
        }

        partner.verificationStatus = verificationStatus;
        if (verificationStatus !== 'Approved') {
            partner.status = 'Offline'; // Force offline if not approved
        }
        await partner.save();

        res.json(partner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Manually assign delivery partner to order
// @route   PUT /api/orders/:id/assign-delivery
// @access  Private (Admin/Manager)
export const assignDeliveryPartner = async (req, res) => {
    try {
        const { partnerUserId } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const partnerUser = await User.findById(partnerUserId);
        if (!partnerUser || partnerUser.role !== 'DeliveryPartner') {
            return res.status(400).json({ message: 'Invalid delivery partner selected' });
        }

        const partnerProfile = await DeliveryPartner.findOne({ userId: partnerUserId });
        if (!partnerProfile || partnerProfile.status !== 'Online' || partnerProfile.verificationStatus !== 'Approved') {
            return res.status(400).json({ message: 'Delivery partner is offline or not approved' });
        }

        // Fetch Restaurant details to compute distance/charges
        const restaurant = await Restaurant.findById(order.restaurantId);
        const settings = restaurant?.deliverySettings || {};

        order.deliveryPartner = partnerUserId;
        order.deliveryStatus = 'Pending Assignment';
        if (!order.deliveryOtp) {
            order.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
        }
        order.deliveryDistance = Math.floor(Math.random() * 8) + 1; // Simulated distance
        
        // Calculate dynamic delivery fee
        let fee = settings.baseFee || 30;
        const dist = order.deliveryDistance;
        const freeD = settings.freeRadius || 2;
        if (dist > freeD) {
            fee += (dist - freeD) * (settings.perKmCharge || 10);
        }
        if (settings.minOrderAmountForFreeDelivery && order.totalPrice >= settings.minOrderAmountForFreeDelivery) {
            fee = 0;
        }
        
        order.deliveryCharge = fee;
        order.deliveryETA = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
        await order.save();

        // Emit Socket Event
        if (req.app.get('socketio')) {
            const io = req.app.get('socketio');
            io.emit('order_status_updated', order);
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auto-assign nearest online delivery partner
// @route   PUT /api/orders/:id/auto-assign
// @access  Private (Admin/Manager)
export const autoAssignDeliveryPartner = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Find all online & approved delivery partners who do not have an active task
        const onlinePartners = await DeliveryPartner.find({
            restaurantId: order.restaurantId,
            status: 'Online',
            verificationStatus: 'Approved'
        });

        if (onlinePartners.length === 0) {
            return res.status(404).json({ message: 'No online delivery partners available' });
        }

        // Choose a random one (simulating "nearest")
        const partner = onlinePartners[Math.floor(Math.random() * onlinePartners.length)];

        // Configure order fields
        const restaurant = await Restaurant.findById(order.restaurantId);
        const settings = restaurant?.deliverySettings || {};

        order.deliveryPartner = partner.userId;
        order.deliveryStatus = 'Pending Assignment';
        if (!order.deliveryOtp) {
            order.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
        }
        order.deliveryDistance = Math.floor(Math.random() * 6) + 1; // 1-7 km mock
        
        let fee = settings.baseFee || 30;
        const dist = order.deliveryDistance;
        const freeD = settings.freeRadius || 2;
        if (dist > freeD) {
            fee += (dist - freeD) * (settings.perKmCharge || 10);
        }
        if (settings.minOrderAmountForFreeDelivery && order.totalPrice >= settings.minOrderAmountForFreeDelivery) {
            fee = 0;
        }

        order.deliveryCharge = fee;
        order.deliveryETA = new Date(Date.now() + 25 * 60 * 1000);
        await order.save();

        // Socket Event
        if (req.app.get('socketio')) {
            const io = req.app.get('socketio');
            io.emit('order_status_updated', order);
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get delivery analytics
// @route   GET /api/delivery/analytics
// @access  Private (Admin/Manager)
export const getDeliveryAnalytics = async (req, res) => {
    try {
        const completedOrders = await Order.find({
            restaurantId: req.user.restaurantId,
            orderType: 'Delivery',
            status: 'Delivered'
        });

        const cancelledOrders = await Order.find({
            restaurantId: req.user.restaurantId,
            orderType: 'Delivery',
            deliveryStatus: 'Cancelled'
        });

        const totalDeliveries = completedOrders.length;
        const totalEarnings = completedOrders.reduce((acc, curr) => acc + (curr.deliveryCharge || 0), 0);
        
        // Mock analytics data
        const avgDeliveryTime = totalDeliveries > 0 ? 24 : 0; // 24 minutes mock
        const successRate = totalDeliveries + cancelledOrders.length > 0
            ? Math.round((totalDeliveries / (totalDeliveries + cancelledOrders.length)) * 100)
            : 100;
        
        res.json({
            totalDeliveries,
            avgDeliveryTime: `${avgDeliveryTime} mins`,
            deliverySuccessRate: `${successRate}%`,
            cancellationRate: `${100 - successRate}%`,
            totalDeliveryEarnings: totalEarnings,
            avgRating: 4.8
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit customer feedback rating
// @route   PUT /api/orders/:id/delivery-rating
// @access  Public
export const submitDeliveryRating = async (req, res) => {
    try {
        const { speed, behaviour, foodHandling, overall, review } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.deliveryRating = {
            speed: speed || 5,
            behaviour: behaviour || 5,
            foodHandling: foodHandling || 5,
            overall: overall || 5,
            review: review || ''
        };

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update restaurant settings for delivery
// @route   PUT /api/restaurants/mine/delivery-settings
// @access  Private (Admin/Manager)
export const updateDeliverySettings = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.user.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        restaurant.deliverySettings = {
            ...restaurant.deliverySettings,
            ...req.body
        };

        await restaurant.save();
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
