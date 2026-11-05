import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import { sendTrialExpiredAndFrozenEmail } from '../utils/emailService.js';

/**
 * Middleware to strictly enforce subscription status and dashboard freeze.
 * Bypassed for SuperAdmin, Customer roles, and demo restaurants.
 * Restricts operational access when trial is pending, rejected, expired, or manually frozen.
 */
export const checkSubscriptionAccess = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) return next();

        // 1. SuperAdmin and Customers are never restricted by restaurant subscriptions
        if (user.role === 'SuperAdmin' || user.role === 'Customer') {
            return next();
        }

        // 2. Resolve restaurant ID
        const restaurantId = user.restaurantId || req.params.restaurantId || req.headers['x-restaurant-id'];
        if (!restaurantId) {
            return next();
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return next();
        }

        // 3. Demo restaurants are unrestricted
        if (restaurant.isDemo) {
            return next();
        }

        const sub = restaurant.subscription || {};
        const now = new Date();

        // 4. Check for Manual Super Admin Freeze
        if (sub.manualFreeze || sub.status === 'Frozen') {
            return res.status(403).json({
                isFrozen: true,
                manualFreeze: true,
                subscriptionStatus: 'Frozen',
                freezeReason: sub.freezeReason || 'Administrative freeze placed by Super Admin.',
                message: 'Your restaurant dashboard has been frozen by administration. Please contact support.'
            });
        }

        // 5. Check if Free Trial is Pending Approval
        if (sub.status === 'Pending Approval') {
            return res.status(403).json({
                isFrozen: true,
                isPendingApproval: true,
                subscriptionStatus: 'Pending Approval',
                message: 'Your 7-Day Free Trial request is pending Super Admin approval. Operational features will unlock once approved.'
            });
        }

        // 6. Check if Free Trial was Rejected
        if (sub.status === 'Rejected') {
            return res.status(403).json({
                isFrozen: true,
                isRejected: true,
                rejectionReason: sub.rejectionReason || 'Trial request was not approved.',
                subscriptionStatus: 'Rejected',
                message: 'Your free trial request was rejected. Please select an active subscription plan to unlock your dashboard.'
            });
        }

        // 7. Check Free Trial Expiration
        if (sub.trialActive) {
            if (sub.trialEndDate && now > new Date(sub.trialEndDate)) {
                // Auto-transition to Expired
                restaurant.subscription.status = 'Expired';
                restaurant.subscription.trialActive = false;
                await restaurant.save();

                // Send expired email notification
                try {
                    const owner = await User.findById(restaurant.ownerId || user._id);
                    if (owner?.email) {
                        sendTrialExpiredAndFrozenEmail({
                            email: owner.email,
                            name: owner.name,
                            restaurantName: restaurant.name,
                            expiredDate: sub.trialEndDate,
                            plan: sub.plan
                        }).catch(e => console.error('[Auto-Expire Email Error]:', e.message));
                    }
                } catch (e) {
                    console.error('[Auto-Expire Lookup Error]:', e.message);
                }

                return res.status(403).json({
                    isFrozen: true,
                    isExpired: true,
                    subscriptionStatus: 'Expired',
                    message: 'Your 7-day free trial has expired and dashboard features are frozen. Please upgrade your subscription plan to continue.'
                });
            }
        }

        // 8. Check Paid Subscription Expiration
        if (sub.subscriptionEndDate && now > new Date(sub.subscriptionEndDate)) {
            if (sub.status !== 'Expired') {
                restaurant.subscription.status = 'Expired';
                await restaurant.save();
            }
            return res.status(403).json({
                isFrozen: true,
                isExpired: true,
                subscriptionStatus: 'Expired',
                message: 'Your subscription plan has expired. Please renew your plan to restore full operational access.'
            });
        }

        // 9. Check legacy or general inactive status
        if (sub.status === 'Expired' || sub.status === 'Inactive') {
            return res.status(403).json({
                isFrozen: true,
                isExpired: true,
                subscriptionStatus: sub.status,
                message: 'An active subscription plan or approved free trial is required to access operational features.'
            });
        }

        // Access allowed
        next();
    } catch (error) {
        console.error('[Subscription Middleware Error]:', error.message);
        next();
    }
};

