import crypto from 'crypto';
import Razorpay from 'razorpay';
import Plan from '../models/Plan.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendTrialExpiredAndFrozenEmail, sendSubscriptionExpiredEmail } from './emailService.js';

export const DEFAULT_PLAN_CATALOG = {
    Basic: {
        name: 'Basic',
        monthlyPrice: 2999,
        yearlyPrice: 2399,
        branchesLimit: 1,
        staffLimit: 5,
    },
    Starter: {
        name: 'Starter',
        monthlyPrice: 2999,
        yearlyPrice: 2399,
        branchesLimit: 1,
        staffLimit: 5,
    },
    Pro: {
        name: 'Pro',
        monthlyPrice: 5999,
        yearlyPrice: 4799,
        branchesLimit: 3,
        staffLimit: 9999,
    },
    Professional: {
        name: 'Professional',
        monthlyPrice: 5999,
        yearlyPrice: 4799,
        branchesLimit: 3,
        staffLimit: 9999,
    },
    Enterprise: {
        name: 'Enterprise',
        monthlyPrice: 12999,
        yearlyPrice: 10399,
        branchesLimit: 9999,
        staffLimit: 9999,
    },
};

export const normalizePlanName = (planName) => {
    if (!planName) return 'Basic';
    const raw = String(planName).trim();
    const lower = raw.toLowerCase();
    if (lower.includes('trial') || lower.includes('free')) return 'Basic';
    if (lower === 'basic' || lower === 'starter') return 'Basic';
    if (lower === 'pro' || lower === 'professional') return 'Pro';
    if (lower === 'enterprise') return 'Enterprise';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
};

export const findPlanDocument = async (planName) => {
    if (!planName) return null;
    const raw = String(planName).trim();
    const normalized = normalizePlanName(raw);
    const aliases = Array.from(new Set([
        raw,
        normalized,
        ...(normalized === 'Basic' ? ['Basic', 'Starter'] : []),
        ...(normalized === 'Pro' ? ['Pro', 'Professional'] : []),
    ]));

    for (const candidate of aliases) {
        const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const found = await Plan.findOne({ name: { $regex: `^${escaped}$`, $options: 'i' } }).lean();
        if (found) return found;
    }
    return null;
};

export const resolvePlanPrice = async (planName, billingCycle = 'monthly') => {
    const normalized = normalizePlanName(planName);
    const planDoc = await findPlanDocument(planName);
    const fallback = DEFAULT_PLAN_CATALOG[normalized] || DEFAULT_PLAN_CATALOG.Basic;
    const isYearly = billingCycle === 'yearly';

    const price = planDoc
        ? Number(isYearly ? (planDoc.yearlyPrice ?? planDoc.monthlyPrice ?? fallback.yearlyPrice) : (planDoc.monthlyPrice ?? fallback.monthlyPrice))
        : Number(isYearly ? fallback.yearlyPrice : fallback.monthlyPrice);

    return {
        planName: planDoc?.name || normalized,
        planDoc,
        price: Math.max(0, price),
    };
};

export const calculateProratedUpgrade = async (restaurant, targetPlanName, billingCycle = 'monthly') => {
    const { planName: resolvedName, planDoc, price: targetPrice } = await resolvePlanPrice(targetPlanName, billingCycle);

    const sub = restaurant?.subscription || {};
    const currentPlanName = sub.plan || 'Basic';
    const currentCycle = sub.billingCycle || 'monthly';
    const isCurrentlyPaidActive = sub.status === 'Active' && sub.paymentStatus === 'Paid' && !sub.trialActive;

    let remainingCredit = 0;
    if (isCurrentlyPaidActive) {
        const { price: currentPrice } = await resolvePlanPrice(currentPlanName, currentCycle);
        const now = new Date();
        const expiryRaw = sub.subscriptionEndDate || sub.expiryDate;
        const expiry = expiryRaw ? new Date(expiryRaw) : now;
        const totalDuration = currentCycle === 'yearly' ? 365 : 30;
        const remainingDays = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
        remainingCredit = Math.floor((currentPrice / totalDuration) * remainingDays);
    }

    const chargeAmount = Math.max(1, targetPrice - remainingCredit);

    return {
        planName: resolvedName,
        planDoc,
        billingCycle: billingCycle === 'yearly' ? 'yearly' : 'monthly',
        targetPrice,
        remainingCredit,
        chargeAmount,
    };
};

export const getRazorpayCredentials = () => {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keyId || !keySecret) {
        const err = new Error('Razorpay payment gateway credentials are not configured on the server.');
        err.statusCode = 503;
        throw err;
    }
    return { keyId, keySecret };
};

export const getRazorpayInstance = () => {
    const { keyId, keySecret } = getRazorpayCredentials();
    return {
        keyId,
        keySecret,
        instance: new Razorpay({ key_id: keyId, key_secret: keySecret }),
    };
};

export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
    if (!orderId || !paymentId || !signature) return false;
    const { keySecret } = getRazorpayCredentials();
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body)
        .digest('hex');
    return expectedSignature === signature;
};

/**
 * Evaluates whether a restaurant has operational dashboard access.
 * Atomically transitions expired trials/subscriptions to 'Expired' at most once
 * so concurrent API requests do not spam duplicate emails or notifications.
 */
export const evaluateSubscriptionAccess = async (restaurant, { notifyOnExpire = true } = {}) => {
    if (!restaurant) return { isFrozen: false };
    if (restaurant.isDemo) return { isFrozen: false };

    const sub = restaurant.subscription || {};
    const now = new Date();

    // 1. Manual Super Admin Freeze
    if (sub.manualFreeze || sub.status === 'Frozen') {
        return {
            isFrozen: true,
            manualFreeze: true,
            subscriptionStatus: 'Frozen',
            freezeReason: sub.freezeReason || 'Administrative freeze placed by Super Admin.',
            message: 'Your restaurant dashboard has been frozen by administration. Please contact support.',
        };
    }

    // 2. Pending Trial Approval
    if (sub.status === 'Pending Approval') {
        return {
            isFrozen: true,
            isPendingApproval: true,
            subscriptionStatus: 'Pending Approval',
            message: 'Your 7-Day Free Trial request is pending Super Admin approval. Operational features will unlock once approved.',
        };
    }

    // 3. Rejected Trial Request
    if (sub.status === 'Rejected') {
        return {
            isFrozen: true,
            isRejected: true,
            rejectionReason: sub.rejectionReason || 'Trial request was not approved.',
            subscriptionStatus: 'Rejected',
            message: 'Your free trial request was rejected. Please select an active subscription plan to unlock your dashboard.',
        };
    }

    // 4. Free Trial Expiration Check
    const trialEnd = sub.trialEndDate || sub.expiryDate;
    if (sub.trialActive && trialEnd && now > new Date(trialEnd)) {
        const transitioned = await Restaurant.findOneAndUpdate(
            { _id: restaurant._id, 'subscription.status': 'Active', 'subscription.trialActive': true },
            { $set: { 'subscription.status': 'Expired', 'subscription.trialActive': false } },
            { new: true }
        );

        restaurant.subscription.status = 'Expired';
        restaurant.subscription.trialActive = false;

        if (transitioned && notifyOnExpire) {
            Notification.create({
                title: '7-Day Free Trial Expired',
                desc: 'Your 7-day free trial has ended and your dashboard has been frozen. Please subscribe to restore access.',
                type: 'System',
                restaurantId: restaurant._id,
            }).catch((e) => console.error('[Subscription Notif Error]:', e.message));

            User.findById(restaurant.ownerId)
                .select('email name')
                .lean()
                .then((owner) => {
                    if (owner?.email) {
                        return sendTrialExpiredAndFrozenEmail({
                            email: owner.email,
                            name: owner.name,
                            restaurantName: restaurant.name,
                            expiredDate: trialEnd,
                            plan: sub.plan,
                        });
                    }
                })
                .catch((e) => console.error('[Auto-Expire Email Error]:', e.message));
        }

        return {
            isFrozen: true,
            isExpired: true,
            subscriptionStatus: 'Expired',
            message: 'Your 7-day free trial has expired and dashboard features are frozen. Please upgrade your subscription plan to continue.',
        };
    }

    // 5. Paid / General Subscription Expiration Check
    const paidEnd = sub.subscriptionEndDate || sub.expiryDate;
    if (!sub.trialActive && paidEnd && now > new Date(paidEnd)) {
        const transitioned = await Restaurant.findOneAndUpdate(
            { _id: restaurant._id, 'subscription.status': { $in: ['Active', 'Expiring Soon'] } },
            { $set: { 'subscription.status': 'Expired' } },
            { new: true }
        );

        restaurant.subscription.status = 'Expired';

        if (transitioned && notifyOnExpire) {
            Notification.create({
                title: 'Subscription Expired',
                desc: `Your ${sub.plan || 'subscription'} plan has expired and operational features are frozen. Please renew to restore access.`,
                type: 'System',
                restaurantId: restaurant._id,
            }).catch((e) => console.error('[Subscription Notif Error]:', e.message));

            User.findById(restaurant.ownerId)
                .select('email name')
                .lean()
                .then((owner) => {
                    if (owner?.email) {
                        return sendSubscriptionExpiredEmail({
                            email: owner.email,
                            name: owner.name,
                            restaurantName: restaurant.name,
                            plan: sub.plan,
                            expiryDate: paidEnd,
                        });
                    }
                })
                .catch((e) => console.error('[Paid-Expire Email Error]:', e.message));
        }

        return {
            isFrozen: true,
            isExpired: true,
            subscriptionStatus: 'Expired',
            message: 'Your subscription plan has expired. Please renew your plan to restore full operational access.',
        };
    }

    // 6. Explicitly Inactive / Expired / Suspended / Cancelled / Failed Payment states
    if (['Expired', 'Inactive', 'Suspended', 'Cancelled'].includes(sub.status) || sub.paymentStatus === 'Failed') {
        return {
            isFrozen: true,
            isExpired: true,
            subscriptionStatus: sub.status || 'Expired',
            message: sub.paymentStatus === 'Failed'
                ? 'Last subscription payment failed. Please complete payment to unlock your dashboard.'
                : 'An active subscription plan or approved free trial is required to access operational features.',
        };
    }

    return { isFrozen: false };
};

/**
 * Applies a verified paid subscription activation onto a Restaurant document
 * without wiping unrelated Mongoose subdocument fields.
 */
export const applyPaidSubscriptionActivation = (restaurant, { planName, billingCycle = 'monthly', targetPrice }) => {
    const now = new Date();
    const cycle = billingCycle === 'yearly' ? 'yearly' : 'monthly';
    const newExpiry = new Date(now);
    newExpiry.setDate(newExpiry.getDate() + (cycle === 'yearly' ? 365 : 30));

    if (!restaurant.subscription) {
        restaurant.subscription = {};
    }

    restaurant.subscription.status = 'Active';
    restaurant.subscription.plan = planName;
    restaurant.subscription.billingCycle = cycle;
    restaurant.subscription.trialActive = false;
    restaurant.subscription.paymentStatus = 'Paid';
    restaurant.subscription.manualFreeze = false;
    restaurant.subscription.freezeReason = '';
    restaurant.subscription.rejectionReason = '';
    restaurant.subscription.subscriptionStartDate = now;
    restaurant.subscription.subscriptionEndDate = newExpiry;
    restaurant.subscription.startDate = now;
    restaurant.subscription.expiryDate = newExpiry;
    restaurant.subscription.price = Number(targetPrice || 0);
    restaurant.subscription.downgradeScheduledPlan = '';
    restaurant.subscription.downgradeScheduledDate = null;

    restaurant.isActive = true;
    if (restaurant.approvalStatus === 'Pending' || restaurant.approvalStatus === 'Rejected') {
        restaurant.approvalStatus = 'Approved';
    }

    return newExpiry;
};

