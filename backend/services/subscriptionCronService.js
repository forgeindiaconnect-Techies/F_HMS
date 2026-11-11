import Restaurant from '../models/Restaurant.js';
import Notification from '../models/Notification.js';
import {
    sendTrialExpiringReminderEmail,
    sendTrialExpiredAndFrozenEmail,
    sendSubscriptionExpiredEmail
} from '../utils/emailService.js';
import { broadcastToRestaurant } from '../config/websocket.js';

let isAuditRunning = false;

/**
 * Periodically checks for:
 * 1. 24-hour expiration reminder for active free trials
 * 2. Automatic expiration and dashboard freeze for expired trials
 * 3. Automatic expiration for expired paid subscriptions
 */
export const runSubscriptionAudit = async () => {
    if (isAuditRunning) return;
    isAuditRunning = true;

    try {
        const now = new Date();
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // 1. Check for trials expiring in the next 24 hours (that haven't received reminder yet)
        const expiringTrials = await Restaurant.find({
            isDemo: { $ne: true },
            'subscription.trialActive': true,
            'subscription.status': 'Active',
            'subscription.trialEndDate': { $lte: oneDayFromNow, $gt: now },
            'subscription.reminderSent24h': { $ne: true }
        }).populate('ownerId', 'email name');

        for (const rest of expiringTrials) {
            try {
                const ownerEmail = rest.ownerId?.email;
                const ownerName = rest.ownerId?.name || rest.name;
                if (ownerEmail) {
                    await sendTrialExpiringReminderEmail({
                        email: ownerEmail,
                        name: ownerName,
                        restaurantName: rest.name,
                        hoursRemaining: 24,
                        trialEndDate: rest.subscription.trialEndDate,
                        plan: rest.subscription.plan
                    });
                }
                rest.subscription.reminderSent24h = true;
                await rest.save();
            } catch (err) {
                console.error(`[Subscription Cron Error] 24h reminder failed for ${rest.name}:`, err.message);
            }
        }

        // 2. Check for active free trials that have passed trialEndDate -> Expire & Freeze dashboard
        const expiredTrials = await Restaurant.find({
            isDemo: { $ne: true },
            'subscription.trialActive': true,
            'subscription.status': 'Active',
            'subscription.trialEndDate': { $lte: now }
        }).populate('ownerId', 'email name');

        for (const rest of expiredTrials) {
            try {
                const transitioned = await Restaurant.findOneAndUpdate(
                    { _id: rest._id, 'subscription.status': 'Active', 'subscription.trialActive': true },
                    { $set: { 'subscription.status': 'Expired', 'subscription.trialActive': false } },
                    { new: true }
                );
                if (!transitioned) continue;

                await Notification.create({
                    title: '7-Day Free Trial Expired',
                    desc: 'Your 7-day free trial has ended and dashboard access is frozen. Subscribe to restore access.',
                    type: 'System',
                    restaurantId: rest._id
                }).catch(() => {});

                broadcastToRestaurant(rest._id, 'subscription_updated', {
                    restaurantId: String(rest._id),
                    subscription: transitioned.subscription
                });

                const ownerEmail = rest.ownerId?.email;
                const ownerName = rest.ownerId?.name || rest.name;
                if (ownerEmail) {
                    await sendTrialExpiredAndFrozenEmail({
                        email: ownerEmail,
                        name: ownerName,
                        restaurantName: rest.name,
                        expiredDate: rest.subscription.trialEndDate,
                        plan: rest.subscription.plan
                    });
                }
            } catch (err) {
                console.error(`[Subscription Cron Error] Trial freeze failed for ${rest.name}:`, err.message);
            }
        }

        // 3. Check for paid subscriptions that have passed subscriptionEndDate or legacy expiryDate
        const expiredPaidSubscriptions = await Restaurant.find({
            isDemo: { $ne: true },
            'subscription.trialActive': { $ne: true },
            'subscription.status': { $in: ['Active', 'Expiring Soon'] },
            $or: [
                { 'subscription.subscriptionEndDate': { $lte: now } },
                { 'subscription.subscriptionEndDate': null, 'subscription.expiryDate': { $lte: now } }
            ]
        }).populate('ownerId', 'email name');

        for (const rest of expiredPaidSubscriptions) {
            try {
                const transitioned = await Restaurant.findOneAndUpdate(
                    { _id: rest._id, 'subscription.status': { $in: ['Active', 'Expiring Soon'] } },
                    { $set: { 'subscription.status': 'Expired' } },
                    { new: true }
                );
                if (!transitioned) continue;

                await Notification.create({
                    title: 'Subscription Expired',
                    desc: `Your ${rest.subscription?.plan || 'subscription'} plan has expired and dashboard access is frozen. Please renew to restore access.`,
                    type: 'System',
                    restaurantId: rest._id
                }).catch(() => {});

                broadcastToRestaurant(rest._id, 'subscription_updated', {
                    restaurantId: String(rest._id),
                    subscription: transitioned.subscription
                });

                const ownerEmail = rest.ownerId?.email;
                const ownerName = rest.ownerId?.name || rest.name;
                if (ownerEmail) {
                    await sendSubscriptionExpiredEmail({
                        email: ownerEmail,
                        name: ownerName,
                        restaurantName: rest.name,
                        plan: rest.subscription?.plan,
                        expiryDate: rest.subscription?.subscriptionEndDate || rest.subscription?.expiryDate
                    });
                }
            } catch (err) {
                console.error(`[Subscription Cron Error] Paid expiry failed for ${rest.name}:`, err.message);
            }
        }
    } catch (globalErr) {
        console.error('[Subscription Cron Global Error]:', globalErr.message);
    } finally {
        isAuditRunning = false;
    }
};

/**
 * Initializes background subscription scheduler
 */
export const initSubscriptionScheduler = () => {
    setTimeout(() => {
        runSubscriptionAudit();
    }, 10000);

    setInterval(() => {
        runSubscriptionAudit();
    }, 10 * 60 * 1000);

    console.log('[Subscription Scheduler] Initialized: Audits running every 10 minutes');
};
