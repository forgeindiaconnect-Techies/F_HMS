import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import { 
    sendTrialExpiringReminderEmail, 
    sendTrialExpiredAndFrozenEmail 
} from '../utils/emailService.js';

/**
 * Periodically checks for:
 * 1. 24-hour expiration reminder for active free trials
 * 2. Automatic expiration and dashboard freeze for expired trials
 * 3. Automatic expiration for expired paid subscriptions
 */
export const runSubscriptionAudit = async () => {
    try {
        const now = new Date();
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // 1. Check for trials expiring in the next 24 hours (that haven't received reminder yet)
        const expiringTrials = await Restaurant.find({
            'subscription.trialActive': true,
            'subscription.status': 'Active',
            'subscription.trialEndDate': { $lte: oneDayFromNow, $gt: now },
            'subscription.reminderSent24h': { $ne: true }
        }).populate('ownerId');

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
                console.log(`[Subscription Cron] Sent 24h expiration reminder to ${rest.name} (${ownerEmail})`);
            } catch (err) {
                console.error(`[Subscription Cron Error] 24h reminder failed for ${rest.name}:`, err.message);
            }
        }

        // 2. Check for active free trials that have passed trialEndDate -> Freeze dashboard
        const expiredTrials = await Restaurant.find({
            'subscription.trialActive': true,
            'subscription.status': 'Active',
            'subscription.trialEndDate': { $lte: now }
        }).populate('ownerId');

        for (const rest of expiredTrials) {
            try {
                rest.subscription.status = 'Expired';
                rest.subscription.trialActive = false;
                await rest.save();

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
                console.log(`[Subscription Cron] Frozen expired free trial for ${rest.name}`);
            } catch (err) {
                console.error(`[Subscription Cron Error] Freeze failed for ${rest.name}:`, err.message);
            }
        }

        // 3. Check for paid subscriptions that have passed subscriptionEndDate
        const expiredPaidSubscriptions = await Restaurant.find({
            'subscription.status': 'Active',
            'subscription.paymentStatus': 'Paid',
            'subscription.subscriptionEndDate': { $lte: now }
        });

        for (const rest of expiredPaidSubscriptions) {
            try {
                rest.subscription.status = 'Expired';
                await rest.save();
                console.log(`[Subscription Cron] Expired paid subscription for ${rest.name}`);
            } catch (err) {
                console.error(`[Subscription Cron Error] Paid expiry failed for ${rest.name}:`, err.message);
            }
        }
    } catch (globalErr) {
        console.error('[Subscription Cron Global Error]:', globalErr.message);
    }
};

/**
 * Initializes background subscription scheduler
 */
export const initSubscriptionScheduler = () => {
    // Run audit immediately once after startup
    setTimeout(() => {
        runSubscriptionAudit();
    }, 10000);

    // Then schedule recurring run every 10 minutes (600,000 ms)
    setInterval(() => {
        runSubscriptionAudit();
    }, 10 * 60 * 1000);

    console.log('[Subscription Scheduler] Initialized: Audits running every 10 minutes');
};
