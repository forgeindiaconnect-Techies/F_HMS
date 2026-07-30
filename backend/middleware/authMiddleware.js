import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Restaurant from '../models/Restaurant.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
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
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
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
