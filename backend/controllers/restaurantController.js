import mongoose from 'mongoose';
import Restaurant from '../models/Restaurant.js';
import Branch from '../models/Branch.js';
import Notification from '../models/Notification.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import SubscriptionPayment from '../models/SubscriptionPayment.js';
import Plan from '../models/Plan.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Multer setup for restaurant logo uploads
const logoUploadDir = 'uploads/logos';
if (!fs.existsSync(logoUploadDir)) {
    fs.mkdirSync(logoUploadDir, { recursive: true });
}

const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, logoUploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'logo-' + unique + path.extname(file.originalname));
    }
});

const logoFileFilter = (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Only image files are allowed'), false);
};

export const logoUpload = multer({
    storage: logoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: logoFileFilter
}).single('logo');

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
export const getRestaurants = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.json([]);
        }
        const restaurants = await Restaurant.find({}).populate('ownerId', 'name email').lean();
        
        // Dynamically enable delivery if there are registered delivery partners
        const populatedRestaurants = await Promise.all(restaurants.map(async (rest) => {
            const hasPartners = await DeliveryPartner.exists({ restaurantId: rest._id });
            if (hasPartners) {
                if (!rest.deliverySettings) {
                    rest.deliverySettings = { 
                        deliveryType: 'Both',
                        enabled: true,
                        radius: 5,
                        freeRadius: 2,
                        baseFee: 30,
                        perKmCharge: 10,
                        peakHourFee: 15,
                        rainSurcharge: 20,
                        minOrderAmountForFreeDelivery: 300,
                        minOrderAmountForDelivery: 0,
                        deliveryOperatingHours: { start: '09:00', end: '22:00' }
                    };
                } else {
                    rest.deliverySettings.enabled = true;
                }
            }
            return rest;
        }));
        
        res.json(populatedRestaurants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update restaurant subscription
// @route   PUT /api/restaurants/:id/subscription
// @access  Private/SuperAdmin
export const updateSubscription = async (req, res) => {
    try {
        const { status, plan, billingCycle, addMonths, addYears } = req.body;
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        if (status) restaurant.subscription.status = status;
        if (plan) restaurant.subscription.plan = plan;
        if (billingCycle) restaurant.subscription.billingCycle = billingCycle;
        
        if (addMonths || addYears) {
            let currentExpiry = restaurant.subscription.expiryDate ? new Date(restaurant.subscription.expiryDate) : new Date();
            // If already expired, start from today
            if (currentExpiry < new Date()) {
                currentExpiry = new Date();
            }
            if (addMonths) currentExpiry.setMonth(currentExpiry.getMonth() + addMonths);
            if (addYears) currentExpiry.setFullYear(currentExpiry.getFullYear() + addYears);
            
            restaurant.subscription.expiryDate = currentExpiry;
            
            // Automatically reactivate on renewal if frozen
            if (restaurant.subscription.status === 'Frozen') {
                restaurant.subscription.status = 'Active';
            }
        }

        const updatedRestaurant = await restaurant.save();
        res.json(updatedRestaurant);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Self-service subscribe/renew subscription
// @route   PUT /api/restaurants/subscribe
// @access  Private/RestaurantAdmin
export const selfSubscribe = async (req, res) => {
    try {
        const { plan, billingCycle } = req.body;
        const restaurant = await Restaurant.findById(req.user.restaurantId);

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const expiryDate = new Date();
        if (billingCycle === 'yearly') {
            expiryDate.setDate(expiryDate.getDate() + 365);
        } else {
            // Monthly
            expiryDate.setDate(expiryDate.getDate() + 30);
        }

        restaurant.subscription = {
            status: 'Active',
            plan: plan || 'Basic',
            billingCycle: billingCycle || 'monthly',
            trialActive: false,
            expiryDate: expiryDate
        };

        const updatedRestaurant = await restaurant.save();
        res.json(updatedRestaurant);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Create a restaurant
// @route   POST /api/restaurants
// @access  Private/Admin
export const createRestaurant = async (req, res) => {
    try {
        const { name, currency, taxRate } = req.body;
        const restaurant = await Restaurant.create({ name, currency, taxRate });
        res.status(201).json(restaurant);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get my restaurant
// @route   GET /api/restaurants/mine
// @access  Private
export const getMyRestaurant = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.json(null);
        }
        if (!req.user.restaurantId) {
            return res.status(404).json({ message: 'No restaurant associated with this user' });
        }
        const restaurant = await Restaurant.findById(req.user.restaurantId);
        
        if (restaurant && restaurant.subscription?.expiryDate) {
            const expiry = new Date(restaurant.subscription.expiryDate);
            const now = new Date();
            
            // Auto apply scheduled downgrade if downgrade date has passed
            if (restaurant.subscription.downgradeScheduledPlan && now >= new Date(restaurant.subscription.downgradeScheduledDate)) {
                const targetPlan = restaurant.subscription.downgradeScheduledPlan;
                restaurant.subscription.plan = targetPlan;
                restaurant.subscription.price = targetPlan === 'Pro' ? 99 : 49;
                restaurant.subscription.downgradeScheduledPlan = '';
                restaurant.subscription.downgradeScheduledDate = null;
                await restaurant.save();

                await Notification.create({
                    title: 'Subscription Downgraded',
                    desc: `Your scheduled downgrade to the ${targetPlan} plan has been processed.`,
                    type: 'System',
                    restaurantId: restaurant._id
                });
            }

            // If subscription is expired, check if we've already notified them
            if (expiry < now && restaurant.subscription.status !== 'Cancelled') {
                const existingNotif = await Notification.findOne({
                    restaurantId: restaurant._id,
                    title: 'Subscription Expired',
                    read: false
                });
                
                if (!existingNotif) {
                    await Notification.create({
                        title: 'Subscription Expired',
                        desc: 'Your subscription has expired. Please renew to continue using all features.',
                        type: 'System',
                        restaurantId: restaurant._id
                    });
                }
            }
        }
        
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update my restaurant
// @route   PUT /api/restaurants/mine
// @access  Private
export const updateMyRestaurant = async (req, res) => {
    try {
        if (!req.user.restaurantId) {
            return res.status(404).json({ message: 'No restaurant associated with this user' });
        }
        
        const { name, contactEmail, phone, address, currency, timezone, features } = req.body;
        
        const restaurant = await Restaurant.findById(req.user.restaurantId);
        if (restaurant) {
            restaurant.name = name || restaurant.name;
            restaurant.contactEmail = contactEmail !== undefined ? contactEmail : restaurant.contactEmail;
            restaurant.phone = phone !== undefined ? phone : restaurant.phone;
            restaurant.address = address !== undefined ? address : restaurant.address;
            restaurant.currency = currency || restaurant.currency;
            restaurant.timezone = timezone || restaurant.timezone;
            if (features) {
                restaurant.features = {
                    onlineOrdering: features.onlineOrdering !== undefined ? features.onlineOrdering : restaurant.features?.onlineOrdering,
                    tableReservations: features.tableReservations !== undefined ? features.tableReservations : restaurant.features?.tableReservations
                };
            }

            // Handle logo upload (Base64 data URL or uploaded file)
            if (req.body.logoBase64) {
                restaurant.logo = req.body.logoBase64;
            } else if (req.file) {
                restaurant.logo = `/uploads/logos/${req.file.filename}`;
            }
            
            const updatedRestaurant = await restaurant.save();
            res.json(updatedRestaurant);
        } else {
            res.status(404).json({ message: 'Restaurant not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get branches for a restaurant
// @route   GET /api/restaurants/:id/branches
// @access  Private
export const getBranches = async (req, res) => {
    try {
        const branches = await Branch.find({ restaurantId: req.params.id }).populate('manager', 'name email');
        res.json(branches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a branch
// @route   POST /api/restaurants/:id/branches
// @access  Private/Admin
export const createBranch = async (req, res) => {
    try {
        const { name, location, contact, manager } = req.body;
        const branch = await Branch.create({
            restaurant: req.params.id,
            name,
            location,
            contact,
            manager
        });
        res.status(201).json(branch);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get a restaurant by ID
// @route   GET /api/restaurants/:id
// @access  Public
export const getRestaurantById = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id).lean();
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        
        // Dynamically enable delivery if there are registered delivery partners
        const hasPartners = await DeliveryPartner.exists({ restaurantId: restaurant._id });
        if (hasPartners) {
            if (!restaurant.deliverySettings) {
                restaurant.deliverySettings = { 
                    deliveryType: 'Both',
                    enabled: true,
                    radius: 5,
                    freeRadius: 2,
                    baseFee: 30,
                    perKmCharge: 10,
                    peakHourFee: 15,
                    rainSurcharge: 20,
                    minOrderAmountForFreeDelivery: 300,
                    minOrderAmountForDelivery: 0,
                    deliveryOperatingHours: { start: '09:00', end: '22:00' }
                };
            } else {
                restaurant.deliverySettings.enabled = true;
            }
        }
        
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my billing/payment history
// @route   GET /api/restaurants/mine/billing-history
// @access  Private/RestaurantAdmin
export const getMyBillingHistory = async (req, res) => {
    try {
        const history = await SubscriptionPayment.find({ restaurantId: req.user.restaurantId }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upgrade subscription plan
// @route   POST /api/restaurants/mine/upgrade
// @access  Private/RestaurantAdmin
export const upgradeSubscription = async (req, res) => {
    try {
        const { planName, billingCycle } = req.body;
        const restaurant = await Restaurant.findById(req.user.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const targetPlan = await Plan.findOne({ name: planName });
        const targetPrice = targetPlan 
            ? (billingCycle === 'yearly' ? targetPlan.yearlyPrice : targetPlan.monthlyPrice)
            : (planName === 'Pro' ? (billingCycle === 'yearly' ? 990 : 99) : (billingCycle === 'yearly' ? 1990 : 199));

        const currentPlanName = restaurant.subscription?.plan || 'Basic';
        const currentPlan = await Plan.findOne({ name: currentPlanName });
        const currentPrice = currentPlan
            ? (restaurant.subscription.billingCycle === 'yearly' ? currentPlan.yearlyPrice : currentPlan.monthlyPrice)
            : 0;

        // Calculate remaining credit from current subscription
        const now = new Date();
        const expiry = restaurant.subscription.expiryDate ? new Date(restaurant.subscription.expiryDate) : now;
        const totalDuration = restaurant.subscription.billingCycle === 'yearly' ? 365 : 30;
        const remainingDays = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
        const remainingCredit = Math.floor((currentPrice / totalDuration) * remainingDays);

        const chargeAmount = Math.max(0, targetPrice - remainingCredit);

        // Set new expiry date
        const newExpiry = new Date();
        if (billingCycle === 'yearly') {
            newExpiry.setDate(newExpiry.getDate() + 365);
        } else {
            newExpiry.setDate(newExpiry.getDate() + 30);
        }

        // Update Restaurant Subscription
        restaurant.subscription = {
            status: 'Active',
            plan: planName,
            billingCycle: billingCycle,
            trialActive: false,
            expiryDate: newExpiry,
            startDate: new Date(),
            price: targetPrice,
            downgradeScheduledPlan: '',
            downgradeScheduledDate: null
        };
        await restaurant.save();

        // Record Completed Subscription Payment
        const transactionId = 'TXN-UPG-' + Date.now().toString().slice(-8).toUpperCase();
        await SubscriptionPayment.create({
            restaurantId: restaurant._id,
            planName,
            amount: chargeAmount,
            billingCycle,
            paymentMethod: 'Card',
            transactionId,
            status: 'Completed',
            effectiveDate: new Date(),
            expiryDate: newExpiry
        });

        // Broadcast System Notification
        await Notification.create({
            title: 'Subscription Upgraded',
            desc: `Your restaurant has been successfully upgraded to the ${planName} plan.`,
            type: 'System',
            restaurantId: restaurant._id
        });

        res.json({
            message: `Your restaurant has been upgraded to ${planName}.`,
            restaurant,
            chargeAmount,
            transactionId
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Schedule downgrade subscription plan
// @route   POST /api/restaurants/mine/downgrade
// @access  Private/RestaurantAdmin
export const downgradeSubscription = async (req, res) => {
    try {
        const { planName } = req.body;
        const restaurant = await Restaurant.findById(req.user.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const expiryDate = restaurant.subscription?.expiryDate || new Date();

        restaurant.subscription.downgradeScheduledPlan = planName;
        restaurant.subscription.downgradeScheduledDate = expiryDate;
        await restaurant.save();

        await Notification.create({
            title: 'Downgrade Scheduled',
            desc: `Your downgrade request to ${planName} has been scheduled to take effect on ${new Date(expiryDate).toLocaleDateString()}.`,
            type: 'System',
            restaurantId: restaurant._id
        });

        res.json({
            message: `Downgrade to ${planName} scheduled successfully. Access remains active until ${new Date(expiryDate).toLocaleDateString()}.`,
            restaurant
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Renew subscription plan
// @route   POST /api/restaurants/mine/renew
// @access  Private/RestaurantAdmin
export const renewSubscription = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.user.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const planName = restaurant.subscription?.plan || 'Basic';
        const billingCycle = restaurant.subscription?.billingCycle || 'monthly';

        const plan = await Plan.findOne({ name: planName });
        const price = plan 
            ? (billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice)
            : (planName === 'Pro' ? (billingCycle === 'yearly' ? 990 : 99) : (billingCycle === 'yearly' ? 1990 : 199));

        let currentExpiry = restaurant.subscription.expiryDate ? new Date(restaurant.subscription.expiryDate) : new Date();
        if (currentExpiry < new Date()) {
            currentExpiry = new Date();
        }

        if (billingCycle === 'yearly') {
            currentExpiry.setDate(currentExpiry.getDate() + 365);
        } else {
            currentExpiry.setDate(currentExpiry.getDate() + 30);
        }

        restaurant.subscription.status = 'Active';
        restaurant.subscription.expiryDate = currentExpiry;
        restaurant.subscription.price = price;
        await restaurant.save();

        const transactionId = 'TXN-REN-' + Date.now().toString().slice(-8).toUpperCase();
        await SubscriptionPayment.create({
            restaurantId: restaurant._id,
            planName,
            amount: price,
            billingCycle,
            paymentMethod: 'Card',
            transactionId,
            status: 'Completed',
            effectiveDate: new Date(),
            expiryDate: currentExpiry
        });

        await Notification.create({
            title: 'Subscription Renewed',
            desc: `Your subscription to the ${planName} plan has been renewed until ${currentExpiry.toLocaleDateString()}.`,
            type: 'System',
            restaurantId: restaurant._id
        });

        res.json({
            message: `Subscription successfully renewed.`,
            restaurant,
            expiryDate: currentExpiry,
            transactionId
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
