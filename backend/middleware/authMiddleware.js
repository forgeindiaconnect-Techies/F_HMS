import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Restaurant from '../models/Restaurant.js';
import Plan from '../models/Plan.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey123');
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Verification Check for Restaurant users
            if (req.user.restaurantId && req.user.role !== 'SuperAdmin' && req.user.role !== 'DeliveryPartner') {
                const isBypassUrl = req.originalUrl.includes('/verification') || 
                                    (req.method === 'GET' && req.originalUrl.includes('/restaurants/mine')) ||
                                    req.originalUrl.includes('/notifications') ||
                                    req.originalUrl.includes('/auth/logout');

                if (!isBypassUrl) {
                    const restaurant = await Restaurant.findById(req.user.restaurantId);
                    if (restaurant && restaurant.verificationStatus !== 'Verified') {
                        return res.status(403).json({
                            message: 'Restaurant verification is pending or incomplete.',
                            requiresVerification: true,
                            verificationStatus: restaurant.verificationStatus
                        });
                    }
                }
            }

            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const optionalProtect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey123');
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Token failed, but optional so ignore
        }
    }
    next();
};

// Check for specific roles
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role ${req.user?.role || 'Unknown'} is not authorized to access this route` 
            });
        }
        next();
    };
};

// Check if restaurant subscription is active
export const checkSubscription = async (req, res, next) => {
    if (!req.user || !req.user.restaurantId || req.user.role === 'DeliveryPartner') {
        return next(); // SuperAdmin, Customer, or DeliveryPartner, skip
    }

    // Bypass check for subscription routes
    if (req.originalUrl.includes('/subscribe') || (req.method === 'GET' && req.originalUrl.includes('/mine'))) {
        return next();
    }

    try {
        const restaurant = await Restaurant.findById(req.user.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const now = new Date();
        const expiry = restaurant.subscription?.expiryDate ? new Date(restaurant.subscription.expiryDate) : null;

        if (restaurant.subscription?.status === 'Frozen' || (expiry && now > expiry)) {
            return res.status(402).json({ 
                message: 'Your subscription has expired or is frozen. Please renew your subscription to continue.',
                requiresSubscription: true
            });
        }
        
        req.restaurant = restaurant;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Failed to verify subscription' });
    }
};

// Check if restaurant is verified
export const checkVerification = async (req, res, next) => {
    if (!req.user || !req.user.restaurantId || req.user.role === 'DeliveryPartner') {
        return next(); // SuperAdmin, Customer, or DeliveryPartner, skip
    }

    // Bypass check for verification endpoints, restaurant info, and basic system calls
    if (
        req.originalUrl.includes('/verification') || 
        (req.method === 'GET' && req.originalUrl.includes('/restaurants/mine')) ||
        req.originalUrl.includes('/notifications') ||
        req.originalUrl.includes('/auth/logout')
    ) {
        return next();
    }

    try {
        const restaurant = await Restaurant.findById(req.user.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        if (restaurant.verificationStatus !== 'Verified') {
            return res.status(403).json({
                message: 'Restaurant verification is pending or incomplete.',
                requiresVerification: true,
                verificationStatus: restaurant.verificationStatus
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Failed to check verification status' });
    }
};

// Check if subscription plan supports a specific feature
export const checkFeature = (featureName) => {
    return async (req, res, next) => {
        // Skip check for super admins, customers, or delivery partners
        if (!req.user || req.user.role === 'SuperAdmin' || req.user.role === 'DeliveryPartner') {
            return next();
        }

        try {
            const restaurant = await Restaurant.findById(req.user.restaurantId);
            if (!restaurant) {
                return res.status(404).json({ message: 'Restaurant not found' });
            }

            const planName = restaurant.subscription?.plan || 'Basic';
            const plan = await Plan.findOne({ name: planName });
            
            // If the plan exists and features are configured, verify permission
            if (plan) {
                const hasFeature = plan.features.some(f => f.toLowerCase() === featureName.toLowerCase());
                if (!hasFeature) {
                    return res.status(403).json({
                        message: `The feature "${featureName}" is not included in your current "${planName}" plan. Please upgrade your subscription to unlock it.`,
                        requiresUpgrade: true,
                        requiredPlan: 'Pro'
                    });
                }
            } else {
                // Fallback rules in case seeds aren't fully loaded
                const fallbackFeatures = {
                    Basic: ['Restaurant Management', 'Menu Management', 'QR Digital Menu', 'Order Management', 'Basic Inventory', 'Basic Reports', 'Customer Support'],
                    Pro: ['Restaurant Management', 'Menu Management', 'QR Digital Menu', 'Order Management', 'Multi Branch', 'Basic Inventory', 'Advanced Inventory', 'Purchase Orders', 'Vendor Management', 'Waste Management', 'Basic Reports', 'Profit & Loss', 'Advanced Analytics', 'PDF Export', 'Excel Export', 'Customer Support'],
                    Enterprise: ['Restaurant Management', 'Menu Management', 'QR Digital Menu', 'Order Management', 'Multi Branch', 'Basic Inventory', 'Advanced Inventory', 'Purchase Orders', 'Vendor Management', 'Waste Management', 'Basic Reports', 'Profit & Loss', 'Advanced Analytics', 'PDF Export', 'Excel Export', 'Customer Support', 'Advanced Support', 'Live Chat', 'Priority Support', 'AI Insights', 'Sales Prediction', 'Inventory Forecast', 'Demand Forecast', 'Menu Recommendations', 'Business Health Score']
                };
                
                const allowed = fallbackFeatures[planName] || fallbackFeatures['Basic'];
                const hasFeature = allowed.some(f => f.toLowerCase() === featureName.toLowerCase());
                
                if (!hasFeature) {
                    return res.status(403).json({
                        message: `The feature "${featureName}" is not included in your current "${planName}" plan. Please upgrade your subscription to unlock it.`,
                        requiresUpgrade: true
                    });
                }
            }
            next();
        } catch (error) {
            res.status(500).json({ message: 'Failed to verify feature access permission' });
        }
    };
};
