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

        const validStatuses = [
            'Pending', 
            'Contacted', 
            'Demo Scheduled', 
            'Requirements Collected', 
            'Proposal Sent', 
            'Payment Pending', 
            'Payment Verified', 
            'Activated', 
            'Rejected'
        ];
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
        const { 
            modules, 
            paymentMethods, 
            serviceChargePercent, 
            gstRatePercent, 
            notes, 
            customPlan,
            branchLimit,
            staffLimit
        } = req.body;

        const request = await BillingDemoRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Demo request not found' });
        }

        if (!request.customBillingConfig) {
            request.customBillingConfig = { modules: {}, paymentMethods: {} };
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

        if (customPlan) {
            request.customPlan = {
                ...request.customPlan,
                ...customPlan
            };
        }

        if (branchLimit !== undefined) {
            if (!request.customPlan) request.customPlan = {};
            request.customPlan.branchLimit = Number(branchLimit);
        }

        if (staffLimit !== undefined) {
            if (!request.customPlan) request.customPlan = {};
            request.customPlan.staffLimit = Number(staffLimit);
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
                'billingConfig.gstRatePercent': request.customBillingConfig.gstRatePercent,
                'billingConfig.branchLimit': request.customPlan?.branchLimit || 1,
                'billingConfig.staffLimit': request.customPlan?.staffLimit || 10,
                'billingConfig.customPlanName': request.customPlan?.planName || 'Custom Plan'
            });
        }

        res.json({
            success: true,
            message: 'Custom billing & module configuration updated successfully',
            data: request
        });
    } catch (error) {
        console.error('Error updating demo config:', error);
        res.status(500).json({ message: error.message || 'Server error updating config' });
    }
};

// @desc    Generate / Update Custom Proposal (Super Admin)
// @route   POST /api/billing-demos/admin/:id/proposal
// @access  Private/SuperAdmin
export const createCustomProposal = async (req, res) => {
    try {
        const {
            planName,
            billingCycle,
            durationMonths,
            branchLimit,
            staffLimit,
            basePrice,
            discountAmount,
            finalAmount,
            internalNotes,
            modulePricing
        } = req.body;

        const request = await BillingDemoRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Demo request not found' });
        }

        request.customPlan = {
            planName: planName || 'Custom Tailored Plan',
            billingCycle: billingCycle || 'yearly',
            durationMonths: Number(durationMonths) || 12,
            branchLimit: Number(branchLimit) || 1,
            staffLimit: Number(staffLimit) || 10,
            basePrice: Number(basePrice) || 0,
            discountAmount: Number(discountAmount) || 0,
            finalAmount: Number(finalAmount) || 0,
            internalNotes: internalNotes || '',
            modulePricing: modulePricing || {},
            proposalSentAt: new Date()
        };

        request.status = 'Proposal Sent';
        await request.save();

        res.json({
            success: true,
            message: `Proposal "${request.customPlan.planName}" generated and marked as Proposal Sent!`,
            data: request
        });
    } catch (error) {
        console.error('Error creating custom proposal:', error);
        res.status(500).json({ message: error.message || 'Server error generating proposal' });
    }
};

// @desc    Verify Payment for Custom Onboarding (Super Admin)
// @route   POST /api/billing-demos/admin/:id/verify-payment
// @access  Private/SuperAdmin
export const verifyDemoPayment = async (req, res) => {
    try {
        const { paymentMethod, transactionId, amountPaid } = req.body;

        const request = await BillingDemoRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Demo request not found' });
        }

        // Prevent duplicate payment verification
        if (request.paymentDetails?.isVerified) {
            return res.status(400).json({ 
                message: 'Payment for this request has already been verified and processed.',
                verifiedAt: request.paymentDetails.verifiedAt
            });
        }

        request.paymentDetails = {
            paymentMethod: paymentMethod || 'UPI',
            transactionId: transactionId || `TXN_${Date.now()}`,
            amountPaid: Number(amountPaid) || (request.customPlan?.finalAmount || 0),
            paidAt: new Date(),
            isVerified: true,
            verifiedAt: new Date(),
            verifiedBy: req.user?._id
        };

        request.status = 'Payment Verified';
        await request.save();

        res.json({
            success: true,
            message: `Payment of ₹${request.paymentDetails.amountPaid} verified successfully! Status is now Payment Verified.`,
            data: request
        });
    } catch (error) {
        console.error('Error verifying demo payment:', error);
        res.status(500).json({ message: error.message || 'Server error verifying payment' });
    }
};

// @desc    Activate custom billing configuration for a restaurant with secure invitation (Super Admin)
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

        // Generate single-use secure activation token
        const cryptoModule = await import('crypto');
        const activationToken = cryptoModule.default.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day validity

        // 3. If still no restaurant exists, create a new active Restaurant & Owner user automatically!
        if (!restaurant) {
            const cleanDigits = request.phoneNumber.replace(/\D/g, '') || '9876543210';
            const ownerEmail = `owner_${cleanDigits}@restosys.com`;
            ownerUser = await User.findOne({
                $or: [{ email: ownerEmail }, { phoneNumber: request.phoneNumber }]
            });

            if (!ownerUser) {
                // Generate a random temporary hash that cannot be guessed
                const tempPassword = cryptoModule.default.randomBytes(24).toString('base64');
                ownerUser = await User.create({
                    name: request.fullName,
                    email: ownerEmail,
                    phoneNumber: request.phoneNumber,
                    password: tempPassword,
                    role: 'RestaurantAdmin',
                    isActive: true,
                    activationToken: activationToken,
                    activationExpires: tokenExpires
                });
            } else {
                ownerUser.activationToken = activationToken;
                ownerUser.activationExpires = tokenExpires;
                await ownerUser.save();
            }

            const durationMonths = request.customPlan?.durationMonths || 12;
            const expiryDate = new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000);

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
                    plan: request.customPlan?.planName || 'Custom SaaS',
                    billingCycle: request.customPlan?.billingCycle || 'yearly',
                    trialActive: false,
                    startDate: new Date(),
                    expiryDate: expiryDate
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
            if (ownerUser) {
                ownerUser.activationToken = activationToken;
                ownerUser.activationExpires = tokenExpires;
                await ownerUser.save();
            }
        }

        // 4. Update the restaurant with the custom billing configuration
        restaurant.billingConfig = {
            isCustomBillingActive: true,
            activatedAt: new Date(),
            demoRequestId: request._id,
            outletFormat: request.outletFormat || 'Fine Dine & Resto-Bar',
            branchLimit: request.customPlan?.branchLimit || 1,
            staffLimit: request.customPlan?.staffLimit || 10,
            customPlanName: request.customPlan?.planName || 'Custom Plan',
            modules: request.customBillingConfig?.modules || {
                posBilling: true,
                dineInTakeawayOrders: true,
                kot: true,
                kds: true,
                menuManagement: true,
                inventoryManagement: true,
                rawMaterials: true,
                staffManagement: true,
                attendance: true,
                payroll: true,
                reports: true,
                salesReports: true,
                expenseManagement: true,
                tableManagement: true,
                reservations: true,
                deliveryManagement: true,
                customerManagement: true,
                branchManagement: true,
                qrOrdering: true,
                onlineOrdering: true,
                gstInvoice: true,
                discounts: true
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

        // Align restaurantConfig.orderKitchen with KOT / KDS settings
        if (!restaurant.restaurantConfig) restaurant.restaurantConfig = {};
        if (!restaurant.restaurantConfig.orderKitchen) restaurant.restaurantConfig.orderKitchen = {};
        const isKot = restaurant.billingConfig.modules.kot !== false;
        const isKds = restaurant.billingConfig.modules.kds !== false;
        restaurant.restaurantConfig.orderKitchen.kotEnabled = isKot;
        restaurant.restaurantConfig.orderKitchen.kdsEnabled = isKds;
        restaurant.restaurantConfig.orderKitchen.kitchenMode = isKds ? 'KDS' : 'KOT_ONLY';

        await restaurant.save();

        // 5. Update the demo request status to 'Activated'
        request.status = 'Activated';
        request.activatedAt = new Date();
        request.restaurantId = restaurant._id;
        request.activation = {
            token: activationToken,
            tokenExpires: tokenExpires,
            invitationSentAt: new Date(),
            isActivated: true,
            activatedAt: new Date()
        };
        await request.save();

        const activationUrl = `${req.protocol}://${req.get('host')}/activate-account?token=${activationToken}`;

        res.json({
            success: true,
            message: `Custom SaaS setup activated for "${restaurant.name}"! Invitation link generated.`,
            data: {
                request,
                restaurant: {
                    _id: restaurant._id,
                    name: restaurant.name,
                    phone: restaurant.phone,
                    billingConfig: restaurant.billingConfig
                },
                invitation: {
                    email: ownerUser ? ownerUser.email : null,
                    phoneNumber: request.phoneNumber,
                    token: activationToken,
                    expiresAt: tokenExpires,
                    activationUrl: activationUrl
                }
            }
        });
    } catch (error) {
        console.error('Error activating billing demo:', error);
        res.status(500).json({ message: error.message || 'Server error activating demo' });
    }
};

// @desc    Resend secure activation invitation link (Super Admin)
// @route   POST /api/billing-demos/admin/:id/resend-invitation
// @access  Private/SuperAdmin
export const resendActivationInvitation = async (req, res) => {
    try {
        const request = await BillingDemoRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Demo request not found' });
        }

        const cryptoModule = await import('crypto');
        const newToken = cryptoModule.default.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        request.activation = {
            ...request.activation,
            token: newToken,
            tokenExpires: tokenExpires,
            invitationSentAt: new Date()
        };
        await request.save();

        // Sync with User
        if (request.restaurantId) {
            const rest = await Restaurant.findById(request.restaurantId);
            if (rest?.ownerId) {
                await User.findByIdAndUpdate(rest.ownerId, {
                    activationToken: newToken,
                    activationExpires: tokenExpires
                });
            }
        }

        const activationUrl = `${req.protocol}://${req.get('host')}/activate-account?token=${newToken}`;

        res.json({
            success: true,
            message: 'A fresh single-use activation invitation has been generated.',
            invitation: {
                phoneNumber: request.phoneNumber,
                token: newToken,
                expiresAt: tokenExpires,
                activationUrl: activationUrl
            }
        });
    } catch (error) {
        console.error('Error resending invitation:', error);
        res.status(500).json({ message: error.message || 'Server error resending invitation' });
    }
};

// @desc    Validate activation token & setup password (Public)
// @route   POST /api/billing-demos/activate-account
// @access  Public
export const activateAccountWithToken = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Activation token is required' });
        }
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Find user with this activationToken
        let user = await User.findOne({
            activationToken: token,
            activationExpires: { $gt: new Date() }
        });

        // Or search in BillingDemoRequest
        if (!user) {
            const demo = await BillingDemoRequest.findOne({
                'activation.token': token,
                'activation.tokenExpires': { $gt: new Date() }
            });

            if (demo && demo.restaurantId) {
                const rest = await Restaurant.findById(demo.restaurantId);
                if (rest?.ownerId) {
                    user = await User.findById(rest.ownerId);
                }
            }
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired activation link. Please contact Super Admin for a fresh invitation.' });
        }

        // Update password and clear token
        user.password = newPassword;
        user.activationToken = null;
        user.activationExpires = null;
        user.isActive = true;
        await user.save();

        res.json({
            success: true,
            message: 'Your account has been successfully secured! You can now log in with your credentials.',
            email: user.email
        });
    } catch (error) {
        console.error('Error activating account with token:', error);
        res.status(500).json({ message: error.message || 'Server error activating account' });
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
