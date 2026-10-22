import BillingDemoRequest from '../models/BillingDemoRequest.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import Branch from '../models/Branch.js';

// @desc    Create new Billing Demo Walkthrough Request (Public)
// @route   POST /api/billing-demos
// @access  Public
export const createBillingDemoRequest = async (req, res) => {
    try {
        const { fullName, phoneNumber, restaurantName, city, outletFormat } = req.body;

        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ message: 'Full Name is required' });
        }
        if (!phoneNumber || !phoneNumber.trim()) {
            return res.status(400).json({ message: 'Mobile Phone Number is required' });
        }
        if (!restaurantName || !restaurantName.trim()) {
            return res.status(400).json({ message: 'Restaurant Name is required' });
        }

        const cleanPhone = phoneNumber.trim();
        const cleanName = fullName.trim();
        const cleanRestName = restaurantName.trim();
        const cleanCity = city ? city.trim() : 'N/A';
        const cleanOutlet = outletFormat ? outletFormat.trim() : 'Fine Dine & Resto-Bar';

        // Check for duplicate pending requests within the last 24 hours to prevent spamming
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existingPending = await BillingDemoRequest.findOne({
            phoneNumber: cleanPhone,
            status: { $in: ['Pending', 'Demo Scheduled'] },
            createdAt: { $gte: twentyFourHoursAgo }
        });

        if (existingPending) {
            return res.status(200).json({
                success: true,
                duplicate: true,
                message: `We already have an active walkthrough request for ${cleanRestName} on ${cleanPhone}. Our POS specialist will contact you shortly!`,
                data: existingPending
            });
        }

        // Check if there is an existing restaurant matching this name or phone to automatically link
        const existingRestaurant = await Restaurant.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${cleanRestName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
                { phone: cleanPhone }
            ]
        });

        const newDemoRequest = new BillingDemoRequest({
            fullName: cleanName,
            phoneNumber: cleanPhone,
            restaurantName: cleanRestName,
            city: cleanCity,
            outletFormat: cleanOutlet,
            restaurantId: existingRestaurant ? existingRestaurant._id : null,
            status: 'Pending',
            customBillingConfig: {
                modules: {
                    posBilling: true,
                    menuManagement: true,
                    tableManagement: cleanOutlet !== 'Quick Service (QSR)' && cleanOutlet !== 'Cloud Kitchen',
                    dineInTakeawayOrders: true,
                    kitchenOrderManagement: true,
                    gstInvoice: true,
                    discounts: true,
                    customerManagement: true,
                    inventoryManagement: true,
                    salesReports: true,
                    staffManagement: true
                },
                paymentMethods: {
                    cash: true,
                    upi: true,
                    card: true,
                    split: true
                },
                serviceChargePercent: cleanOutlet.includes('Fine Dine') || cleanOutlet.includes('Pub') ? 5 : 0,
                gstRatePercent: 5
            }
        });

        const savedRequest = await newDemoRequest.save();

        res.status(201).json({
            success: true,
            message: `Thank you, ${cleanName}! Your free walkthrough request for ${cleanRestName} has been booked. Our specialist will call you on ${cleanPhone}.`,
            data: savedRequest
        });
    } catch (error) {
        console.error('Error creating billing demo request:', error);
        res.status(500).json({ message: error.message || 'Server error creating demo request' });
    }
};

// @desc    Get all billing demo requests with search & filter (Super Admin)
// @route   GET /api/billing-demos/admin
// @access  Private/SuperAdmin
export const getBillingDemoRequests = async (req, res) => {
    try {
        const { search, status, outletFormat } = req.query;

        const query = {};

        if (status && status !== 'ALL') {
            query.status = status;
        }

        if (outletFormat && outletFormat !== 'ALL') {
            query.outletFormat = outletFormat;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
                { fullName: regex },
                { phoneNumber: regex },
                { restaurantName: regex },
                { city: regex },
                { notes: regex }
            ];
        }

        const requests = await BillingDemoRequest.find(query)
            .sort({ createdAt: -1 })
            .populate('restaurantId', 'name contactEmail phone subscription approvalStatus billingConfig logo address');

        // Summary counts
        const all = await BillingDemoRequest.find().lean();
        const counts = {
            total: all.length,
            pending: all.filter(r => r.status === 'Pending').length,
            contacted: all.filter(r => r.status === 'Contacted').length,
            scheduled: all.filter(r => r.status === 'Demo Scheduled').length,
            completed: all.filter(r => r.status === 'Demo Completed').length,
            activated: all.filter(r => r.status === 'Activated').length,
            rejected: all.filter(r => r.status === 'Rejected').length
        };

        res.json({
            success: true,
            counts,
            data: requests
        });
    } catch (error) {
        console.error('Error fetching billing demo requests:', error);
        res.status(500).json({ message: error.message || 'Server error fetching demo requests' });
    }
};

// @desc    Get single billing demo request by ID (Super Admin)
// @route   GET /api/billing-demos/admin/:id
// @access  Private/SuperAdmin
export const getBillingDemoRequestById = async (req, res) => {
    try {
        const request = await BillingDemoRequest.findById(req.params.id)
            .populate('restaurantId');

        if (!request) {
            return res.status(404).json({ message: 'Demo request not found' });
        }

        res.json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// @desc    Update billing demo request status (Super Admin)
// @route   PUT /api/billing-demos/admin/:id/status
// @access  Private/SuperAdmin
export const updateBillingDemoStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;

        const validStatuses = ['Pending', 'Contacted', 'Demo Scheduled', 'Demo Completed', 'Activated', 'Rejected'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const request = await BillingDemoRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Demo request not found' });
        }

        if (status) request.status = status;
        if (notes !== undefined) request.notes = notes;

        await request.save();

        res.json({
            success: true,
            message: `Status updated to "${request.status}"`,
            data: request
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error updating status' });
    }
};

// @desc    Update custom billing configuration for a request (Super Admin)
// @route   PUT /api/billing-demos/admin/:id/config
// @access  Private/SuperAdmin
export const updateBillingDemoConfig = async (req, res) => {
    try {
        const { modules, paymentMethods, serviceChargePercent, gstRatePercent, notes } = req.body;

        const request = await BillingDemoRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Demo request not found' });
        }

        if (!request.customBillingConfig) {
            request.customBillingConfig = {};
        }

        if (modules) {
            request.customBillingConfig.modules = {
                ...request.customBillingConfig.modules,
                ...modules
            };
        }

        if (paymentMethods) {
            request.customBillingConfig.paymentMethods = {
                ...request.customBillingConfig.paymentMethods,
                ...paymentMethods
            };
        }

        if (serviceChargePercent !== undefined) {
            request.customBillingConfig.serviceChargePercent = Number(serviceChargePercent);
        }

        if (gstRatePercent !== undefined) {
            request.customBillingConfig.gstRatePercent = Number(gstRatePercent);
        }

        if (notes !== undefined) {
            request.notes = notes;
        }

        await request.save();

        // If the request is already linked to a restaurant, sync the configuration to the restaurant
        if (request.restaurantId) {
            await Restaurant.findByIdAndUpdate(request.restaurantId, {
                'billingConfig.modules': request.customBillingConfig.modules,
                'billingConfig.paymentMethods': request.customBillingConfig.paymentMethods,
                'billingConfig.serviceChargePercent': request.customBillingConfig.serviceChargePercent,
                'billingConfig.gstRatePercent': request.customBillingConfig.gstRatePercent
            });
        }

        res.json({
            success: true,
            message: 'Custom billing configuration updated successfully',
            data: request
        });
    } catch (error) {
        console.error('Error updating demo config:', error);
        res.status(500).json({ message: error.message || 'Server error updating config' });
    }
};

// @desc    Activate custom billing configuration for a restaurant (Super Admin)
// @route   POST /api/billing-demos/admin/:id/activate
// @access  Private/SuperAdmin
export const activateBillingDemo = async (req, res) => {
    try {
        const request = await BillingDemoRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Demo request not found' });
        }

        let restaurant = null;
        let ownerUser = null;

        // 1. If already linked to a restaurant, activate it on that restaurant
        if (request.restaurantId) {
            restaurant = await Restaurant.findById(request.restaurantId);
        }

        // 2. If not linked, check by name or phone
        if (!restaurant) {
            restaurant = await Restaurant.findOne({
                $or: [
                    { name: { $regex: new RegExp(`^${request.restaurantName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
                    { phone: request.phoneNumber }
                ]
            });
        }

        // 3. If still no restaurant exists, create a new active Restaurant & Owner user automatically!
        if (!restaurant) {
            // Find or create Owner User
            const cleanDigits = request.phoneNumber.replace(/\D/g, '') || '9876543210';
            const ownerEmail = `owner_${cleanDigits}@restosys.com`;
            ownerUser = await User.findOne({
                $or: [{ email: ownerEmail }, { phoneNumber: request.phoneNumber }]
            });

            if (!ownerUser) {
                ownerUser = await User.create({
                    name: request.fullName,
                    email: ownerEmail,
                    phoneNumber: request.phoneNumber,
                    password: 'password123', // Default test password
                    role: 'RestaurantAdmin',
                    isActive: true
                });
            }

            restaurant = await Restaurant.create({
                name: request.restaurantName,
                phone: request.phoneNumber,
                address: request.city || 'Primary City',
                ownerId: ownerUser._id,
                approvalStatus: 'Approved',
                verificationStatus: 'Verified',
                isActive: true,
                subscription: {
                    status: 'Active',
                    plan: 'Pro',
                    billingCycle: 'monthly',
                    trialActive: false,
                    startDate: new Date(),
                    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                }
            });

            ownerUser.restaurantId = restaurant._id;
            await ownerUser.save();

            // Create initial main branch
            await Branch.create({
                restaurantId: restaurant._id,
                name: `${restaurant.name} - Main Outlet`,
                location: { address: request.city || 'Main Street' },
                contact: { phone: request.phoneNumber },
                isActive: true
            });
        } else if (restaurant.ownerId && !ownerUser) {
            ownerUser = await User.findById(restaurant.ownerId);
        }

        // 4. Update the restaurant with the custom billing configuration
        restaurant.billingConfig = {
            isCustomBillingActive: true,
            activatedAt: new Date(),
            demoRequestId: request._id,
            outletFormat: request.outletFormat || 'Fine Dine & Resto-Bar',
            modules: request.customBillingConfig?.modules || {
                posBilling: true,
                menuManagement: true,
                tableManagement: true,
                dineInTakeawayOrders: true,
                kitchenOrderManagement: true,
                gstInvoice: true,
                discounts: true,
                customerManagement: true,
                inventoryManagement: true,
                salesReports: true,
                staffManagement: true
            },
            paymentMethods: request.customBillingConfig?.paymentMethods || {
                cash: true,
                upi: true,
                card: true,
                split: true
            },
            serviceChargePercent: request.customBillingConfig?.serviceChargePercent ?? 5,
            gstRatePercent: request.customBillingConfig?.gstRatePercent ?? 5
        };

        await restaurant.save();

        // 5. Update the demo request status to 'Activated'
        request.status = 'Activated';
        request.activatedAt = new Date();
        request.restaurantId = restaurant._id;
        await request.save();

        res.json({
            success: true,
            message: `Custom billing setup activated for "${restaurant.name}"!`,
            data: {
                request,
                restaurant: {
                    _id: restaurant._id,
                    name: restaurant.name,
                    phone: restaurant.phone,
                    billingConfig: restaurant.billingConfig
                },
                credentials: ownerUser ? {
                    email: ownerUser.email,
                    password: 'password123'
                } : null
            }
        });
    } catch (error) {
        console.error('Error activating billing demo:', error);
        res.status(500).json({ message: error.message || 'Server error activating demo' });
    }
};

// @desc    Delete billing demo request (Super Admin)
// @route   DELETE /api/billing-demos/admin/:id
// @access  Private/SuperAdmin
export const deleteBillingDemoRequest = async (req, res) => {
    try {
        const request = await BillingDemoRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Demo request not found' });
        }

        await BillingDemoRequest.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Billing demo request deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error deleting request' });
    }
};
