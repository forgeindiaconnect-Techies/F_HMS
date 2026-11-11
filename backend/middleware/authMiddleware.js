import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Restaurant from '../models/Restaurant.js';
import Branch from '../models/Branch.js';
import Plan from '../models/Plan.js';
import { checkSubscriptionAccess } from './subscriptionMiddleware.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'supersecretjwtkey123';

const extractRequestToken = (req) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        return req.headers.authorization.split(' ')[1];
    }
    if (req.cookies) {
        return req.cookies.jwt || req.cookies.jwt_staff || req.cookies.jwt_customer || null;
    }
    return null;
};

export const protect = async (req, res, next) => {
    const token = extractRequestToken(req);

    if (token) {
        try {
            const decoded = jwt.verify(token, getJwtSecret());
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            if (req.user.isActive === false || req.user.employmentStatus === 'Terminated') {
                return res.status(401).json({ message: 'Account is deactivated or terminated' });
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
    const token = extractRequestToken(req);

    if (token) {
        try {
            const decoded = jwt.verify(token, getJwtSecret());
            const user = await User.findById(decoded.id).select('-password');
            if (user && user.isActive !== false && user.employmentStatus !== 'Terminated') {
                req.user = user;
            }
        } catch (error) {
            // Token failed, but optional so ignore
        }
    }
    next();
};

// Check for specific roles strictly (SuperAdmin is never conflated with RestaurantAdmin/Admin)
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ 
                message: `User role ${req.user?.role || 'Unknown'} is not authorized to access this route` 
            });
        }

        const userRole = String(req.user.role).trim().toLowerCase().replace(/\s+/g, '');
        const allowed = roles.some(role => {
            const r = String(role).trim().toLowerCase().replace(/\s+/g, '');
            if (userRole === r) return true;
            if ((r === 'restaurantadmin' || r === 'admin') && ['restaurantadmin', 'admin', 'owner'].includes(userRole)) {
                return true;
            }
            if ((r === 'branchmanager' || r === 'manager') && ['branchmanager', 'manager'].includes(userRole)) {
                return true;
            }
            if ((r === 'chef' || r === 'kitchen') && ['chef', 'kitchen'].includes(userRole)) {
                return true;
            }
            return false;
        });

        if (!allowed) {
            return res.status(403).json({ 
                message: `User role ${req.user.role} is not authorized to access this route` 
            });
        }
        next();
    };
};

// Unified subscription enforcement alias so existing router imports get full freeze/expiry checks
export const checkSubscription = checkSubscriptionAccess;

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
        let rId = req.user.restaurantId || req.user.restaurant;
        if (!rId && req.user.branchId) {
            const branchDoc = await Branch.findById(req.user.branchId);
            if (branchDoc) rId = branchDoc.restaurantId;
        }

        if (!rId) {
            return next();
        }

        const restaurant = await Restaurant.findById(rId);
        if (!restaurant) {
            return next();
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
    const normalizeFeatureName = (name) => {
        return name
            .toLowerCase()
            .replace(/management/g, '')
            .replace(/[^a-z0-9]/g, '')
            .trim();
    };

    return async (req, res, next) => {
        // Skip check for super admins, support agents, customers, or delivery partners
        if (!req.user || req.user.role === 'SuperAdmin' || req.user.role === 'SupportAgent' || req.user.role === 'DeliveryPartner') {
            return next();
        }

        try {
            const restaurant = await Restaurant.findById(req.user.restaurantId);
            if (!restaurant) {
                return res.status(404).json({ message: 'Restaurant not found' });
            }

            const planName = restaurant.subscription?.plan || 'Basic';
            const lowerPlan = String(planName).trim().toLowerCase();

            // Active trials, Enterprise tiers, and custom billing setups always have access to tier features
            if (
                (restaurant.subscription?.trialActive && restaurant.subscription?.status === 'Active') ||
                ['enterprise', 'custom saas', 'custom plan'].includes(lowerPlan) ||
                restaurant.billingConfig?.isCustomBillingActive
            ) {
                return next();
            }

            const escapedPlan = planName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const plan = await Plan.findOne({ name: { $regex: new RegExp(`^${escapedPlan}$`, 'i') } });
            const targetNorm = normalizeFeatureName(featureName);

            // Customer Support is a fundamental platform right available to all accounts
            if (targetNorm.includes('support') || targetNorm.includes('customersupport')) {
                return next();
            }

            const fallbackFeatures = {
                basic: ['Restaurant Management', 'Menu Management', 'QR Digital Menu', 'Order Management', 'Basic Inventory', 'Basic Reports', 'Customer Support'],
                starter: ['Restaurant Management', 'Menu Management', 'QR Digital Menu', 'Order Management', 'Basic Inventory', 'Basic Reports', 'Customer Support'],
                pro: ['Restaurant Management', 'Menu Management', 'QR Digital Menu', 'Order Management', 'Multi Branch', 'Basic Inventory', 'Advanced Inventory', 'Purchase Orders', 'Vendor Management', 'Waste Management', 'Basic Reports', 'Profit & Loss', 'Advanced Analytics', 'PDF Export', 'Excel Export', 'Customer Support'],
                professional: ['Restaurant Management', 'Menu Management', 'QR Digital Menu', 'Order Management', 'Multi Branch', 'Basic Inventory', 'Advanced Inventory', 'Purchase Orders', 'Vendor Management', 'Waste Management', 'Basic Reports', 'Profit & Loss', 'Advanced Analytics', 'PDF Export', 'Excel Export', 'Customer Support'],
                enterprise: ['Restaurant Management', 'Menu Management', 'QR Digital Menu', 'Order Management', 'Multi Branch', 'Basic Inventory', 'Advanced Inventory', 'Purchase Orders', 'Vendor Management', 'Waste Management', 'Basic Reports', 'Profit & Loss', 'Advanced Analytics', 'PDF Export', 'Excel Export', 'Customer Support', 'Advanced Support', 'Live Chat', 'Priority Support', 'AI Insights', 'Sales Prediction', 'Inventory Forecast', 'Demand Forecast', 'Menu Recommendations', 'Business Health Score']
            };

            const tierFallback = fallbackFeatures[lowerPlan] || fallbackFeatures.basic;
            const mergedFeatures = plan && Array.isArray(plan.features)
                ? [...plan.features, ...tierFallback]
                : tierFallback;

            const hasFeature = mergedFeatures.some(f => normalizeFeatureName(f) === targetNorm);
            if (!hasFeature) {
                return res.status(403).json({
                    message: `The feature "${featureName}" is not included in your current "${planName}" plan. Please upgrade your subscription to unlock it.`,
                    requiresUpgrade: true,
                    requiredPlan: 'Pro'
                });
            }
            next();
        } catch (error) {
            res.status(500).json({ message: 'Failed to verify feature access permission' });
        }
    };
};

// Enforce module permissions for custom billing configurations on the backend
export const checkBillingModule = (moduleNames) => {
    const modulesToCheck = Array.isArray(moduleNames) ? moduleNames : [moduleNames];

    return async (req, res, next) => {
        // SuperAdmin can bypass module restrictions
        if (req.user?.role === 'SuperAdmin') {
            return next();
        }

        if (!req.user || !req.user.restaurantId) {
            return next();
        }

        try {
            const restaurant = req.restaurant || await Restaurant.findById(req.user.restaurantId);
            if (!restaurant) {
                return next();
            }

            // Only enforce if custom billing is specifically active for this restaurant
            // If isCustomBillingActive is false or undefined, existing restaurants maintain 100% full backward-compatible access
            if (restaurant.billingConfig?.isCustomBillingActive) {
                const modules = restaurant.billingConfig?.modules || {};
                
                // If any of the acceptable module keys is enabled, allow access
                const isEnabled = modulesToCheck.some(mod => modules[mod] !== false);

                if (!isEnabled) {
                    const primaryModule = modulesToCheck[0];
                    return res.status(403).json({
                        message: `Access denied: The "${primaryModule}" module is disabled for your restaurant's billing configuration. Please contact Super Admin to activate this module.`,
                        moduleDisabled: true,
                        module: primaryModule
                    });
                }
            }

            next();
        } catch (error) {
            console.error(`Error in checkBillingModule (${modulesToCheck.join(',')}):`, error);
            next();
        }
    };
};

