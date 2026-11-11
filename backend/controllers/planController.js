import crypto from 'crypto';
import mongoose from 'mongoose';
import Plan from '../models/Plan.js';
import Restaurant from '../models/Restaurant.js';
import SubscriptionPayment from '../models/SubscriptionPayment.js';
import Notification from '../models/Notification.js';
import {
    applyPaidSubscriptionActivation,
    DEFAULT_PLAN_CATALOG,
    resolvePlanPrice
} from '../utils/subscriptionHelper.js';
import { broadcastToRestaurant } from '../config/websocket.js';

const getPublicFallbackPlans = () => ([
    { _id: 'p1', name: 'Basic', monthlyPrice: DEFAULT_PLAN_CATALOG.Basic.monthlyPrice, yearlyPrice: DEFAULT_PLAN_CATALOG.Basic.yearlyPrice, branchesLimit: 1, staffLimit: 5, features: ['1 Branch', 'Basic POS Billing', 'QR Ordering', 'Email Support'], isActive: true },
    { _id: 'p2', name: 'Pro', monthlyPrice: DEFAULT_PLAN_CATALOG.Pro.monthlyPrice, yearlyPrice: DEFAULT_PLAN_CATALOG.Pro.yearlyPrice, branchesLimit: 3, staffLimit: 9999, features: ['Up to 3 Branches', 'Kitchen Display System', 'Online Ordering', 'Advanced Analytics', 'Priority Support'], isActive: true },
    { _id: 'p3', name: 'Enterprise', monthlyPrice: DEFAULT_PLAN_CATALOG.Enterprise.monthlyPrice, yearlyPrice: DEFAULT_PLAN_CATALOG.Enterprise.yearlyPrice, branchesLimit: 9999, staffLimit: 9999, features: ['Unlimited Branches', 'Custom APIs & Webhooks', 'Dedicated Account Manager', 'SLA Guarantee', 'White-label Branding'], isActive: true }
]);

export const getPublicPlans = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.json(getPublicFallbackPlans());
        }
        const plans = await Plan.find({ isActive: { $ne: false } }).sort({ monthlyPrice: 1, createdAt: 1 }).maxTimeMS(3000).lean();
        if (!plans || plans.length === 0) {
            return res.json(getPublicFallbackPlans());
        }
        res.json(plans);
    } catch (error) {
        res.json(getPublicFallbackPlans());
    }
};

/**
 * Razorpay Webhook Handler (handles async payment.captured, qr_code.credited, payment.failed)
 * @route POST /api/plans/webhook
 * @access Public (Signed by X-Razorpay-Signature)
 */
export const handleRazorpayWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '').trim();

        if (!signature || !webhookSecret) {
            return res.status(400).json({ message: 'Missing Razorpay webhook signature or secret' });
        }

        const rawPayload = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
        const expectedSig = crypto.createHmac('sha256', webhookSecret).update(rawPayload).digest('hex');

        if (expectedSig !== signature) {
            return res.status(400).json({ message: 'Invalid webhook signature' });
        }

        const event = req.body?.event;
        const paymentEntity = req.body?.payload?.payment?.entity;
        const qrEntity = req.body?.payload?.qr_code?.entity;
        const notes = paymentEntity?.notes || qrEntity?.notes || {};

        const restaurantId = notes.restaurantId;
        const planName = notes.planName;
        const billingCycle = notes.billingCycle || 'monthly';

        if (!restaurantId) {
            return res.status(200).json({ received: true });
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(200).json({ received: true });
        }

        if (event === 'payment.captured' || event === 'qr_code.credited') {
            if (restaurant.subscription?.manualFreeze) {
                return res.status(200).json({ received: true, skipped: 'manual_freeze' });
            }

            const txnId = paymentEntity?.id || qrEntity?.id || `RZP-WH-${Date.now()}`;
            const alreadyRecorded = await SubscriptionPayment.findOne({ transactionId: txnId, status: 'Completed' }).lean();
            if (!alreadyRecorded && planName) {
                const { planName: resolvedPlanName, price: targetPrice } = await resolvePlanPrice(planName, billingCycle);
                const amountPaid = paymentEntity?.amount ? Math.round(paymentEntity.amount / 100) : targetPrice;

                const newExpiry = applyPaidSubscriptionActivation(restaurant, {
                    planName: resolvedPlanName,
                    billingCycle,
                    targetPrice: amountPaid
                });
                await restaurant.save();

                await SubscriptionPayment.create({
                    restaurantId: restaurant._id,
                    planName: resolvedPlanName,
                    amount: amountPaid,
                    billingCycle,
                    paymentMethod: event === 'qr_code.credited' ? 'Razorpay QR' : 'Razorpay',
                    transactionId: txnId,
                    status: 'Completed',
                    effectiveDate: new Date(),
                    expiryDate: newExpiry
                });

                await Notification.create({
                    title: 'Subscription Activated',
                    desc: `Payment confirmed for ${resolvedPlanName} plan (Txn ID: ${txnId}). Dashboard access is active.`,
                    type: 'System',
                    restaurantId: restaurant._id
                });

                broadcastToRestaurant(restaurant._id, 'subscription_updated', {
                    restaurantId: String(restaurant._id),
                    subscription: restaurant.subscription
                });
            }
        } else if (event === 'payment.failed') {
            const txnId = paymentEntity?.id || `RZP-FAIL-${Date.now()}`;
            const amountAttempted = paymentEntity?.amount ? Math.round(paymentEntity.amount / 100) : 0;

            await SubscriptionPayment.create({
                restaurantId: restaurant._id,
                planName: planName || restaurant.subscription?.plan || 'Basic',
                amount: amountAttempted,
                billingCycle,
                paymentMethod: 'Razorpay',
                transactionId: txnId,
                status: 'Failed',
                effectiveDate: new Date()
            });

            if (restaurant.subscription) {
                restaurant.subscription.paymentStatus = 'Failed';
                await restaurant.save();
            }

            await Notification.create({
                title: 'Subscription Payment Failed',
                desc: `Payment attempt failed for ${planName || 'subscription'} (${paymentEntity?.error_description || 'Gateway declined'}).`,
                type: 'System',
                restaurantId: restaurant._id
            });

            broadcastToRestaurant(restaurant._id, 'subscription_updated', {
                restaurantId: String(restaurant._id),
                subscription: restaurant.subscription
            });
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('[Razorpay Webhook Error]:', error.message);
        res.status(500).json({ message: 'Webhook handler error' });
    }
};
