import mongoose from 'mongoose';
import Restaurant from '../models/Restaurant.js';
import Branch from '../models/Branch.js';
import Notification from '../models/Notification.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import SubscriptionPayment from '../models/SubscriptionPayment.js';
import Plan from '../models/Plan.js';
import User from '../models/User.js';
import RestaurantVerification from '../models/RestaurantVerification.js';
import { sendSubscriptionSuccessEmail, sendTrialRequestSubmittedEmail, sendDashboardAccessRestoredEmail } from '../utils/emailService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import {
    applyPaidSubscriptionActivation,
    calculateProratedUpgrade,
    evaluateSubscriptionAccess,
    findPlanDocument,
    getRazorpayInstance,
    resolvePlanPrice,
    verifyRazorpaySignature
} from '../utils/subscriptionHelper.js';
import { broadcastToRestaurant } from '../config/websocket.js';

// Multer setup for restaurant logo uploads
const logoUploadDir = process.env.VERCEL ? '/tmp/uploads/logos' : 'uploads/logos';
try {
    if (!fs.existsSync(logoUploadDir)) {
        fs.mkdirSync(logoUploadDir, { recursive: true });
    }
} catch {}

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
    limits: { 
        fileSize: 10 * 1024 * 1024, // 10 MB
        fieldSize: 25 * 1024 * 1024  // 25 MB for base64 logos
    },
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

        // Return eligible customer-facing restaurants: must not be deleted, must be active,
        // and have an active subscription or valid free trial.
        const filter = {
            isDeleted: { $ne: true },
            status: { $nin: ['Inactive', 'Suspended', 'Deleted'] },
            isActive: { $ne: false },
            approvalStatus: { $in: ['Approved', 'Pending'] }, // Subscribed restaurants must show automatically without manual DB edits
            $or: [
                { 'subscription.status': { $in: ['Active', 'Expiring Soon'] } },
                { 'subscription.trialActive': true },
                { 'subscription.status': { $nin: ['Cancelled', 'Frozen', 'Expired', 'Suspended', 'Inactive'] } }
            ]
        };

        let restaurants = await Restaurant.find(filter)
            .select('name badge rating deliveryTime cuisineType cuisine address city state country deliverySettings subscription approvalStatus isActive isDeleted status ownerId createdAt')
            .populate('ownerId', 'name email')
            .sort({ createdAt: -1 })
            .lean();
        if (restaurants.length === 0) {
            return res.json([]);
        }

        const restIds = restaurants.map(r => r._id);

        // Batch fetch partner existence, active branches, and slim verification address in 3 parallel queries
        const [partnerRestIds, allBranches, allVerifs] = await Promise.all([
            DeliveryPartner.distinct('restaurantId', { restaurantId: { $in: restIds } }),
            Branch.find({ restaurantId: { $in: restIds }, isActive: true }).select('restaurantId name location').lean(),
            RestaurantVerification.find({ restaurantId: { $in: restIds } })
                .select('restaurantId documents.addressProof.addressText')
                .lean()
                .catch(() => [])
        ]);

        const partnerSet = new Set(partnerRestIds.map(id => String(id)));
        const branchMap = new Map();
        for (const b of allBranches) {
            const key = String(b.restaurantId);
            if (!branchMap.has(key)) branchMap.set(key, []);
            branchMap.get(key).push(b);
        }
        const verifMap = new Map();
        for (const v of allVerifs) {
            verifMap.set(String(v.restaurantId), v);
        }

        const nameFixes = [];
        const populatedRestaurants = restaurants.map((rest) => {
            const restIdStr = String(rest._id);
            if (!rest.name || rest.name.trim() === '' || rest.name === 'Unnamed') {
                const ownerName = rest.ownerId?.name || 'Partner';
                rest.name = `${ownerName}'s Restaurant`;
                nameFixes.push(Restaurant.findByIdAndUpdate(rest._id, { $set: { name: rest.name } }).catch(() => {}));
            }

            if (partnerSet.has(restIdStr)) {
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

            const branches = branchMap.get(restIdStr) || [];
            rest.branches = branches;
            const primaryBranch = branches[0];

            const verif = verifMap.get(restIdStr);
            const verifAddress = verif?.documents?.addressProof?.addressText || '';
            const thumbUrl = `/api/restaurants/${restIdStr}/thumbnail`;
            rest.image = thumbUrl;
            rest.bannerImage = thumbUrl;
            rest.logo = `${thumbUrl}?kind=logo`;
            rest.showcaseImages = [thumbUrl];

            const branchAddress = primaryBranch?.location?.address && primaryBranch.location.address !== 'Primary Location' 
                ? primaryBranch.location.address 
                : '';

            const combinedAddr = rest.address || branchAddress || verifAddress || primaryBranch?.location?.address || '';
            rest.address = combinedAddr;

            let resolvedCity = rest.city && rest.city.trim() ? rest.city.trim() : '';
            if (!resolvedCity && primaryBranch?.location?.city && primaryBranch.location.city !== 'Primary Location') {
                resolvedCity = primaryBranch.location.city.trim();
            }
            if (!resolvedCity && combinedAddr) {
                const addrParts = combinedAddr.split(',').map(p => p.trim()).filter(Boolean);
                if (addrParts.length >= 2) {
                    let candidate = addrParts[addrParts.length - 1];
                    if (candidate.toLowerCase() === 'tamil nadu' || candidate.toLowerCase() === 'karnataka' || candidate.toLowerCase() === 'india') {
                        candidate = addrParts[addrParts.length > 2 ? addrParts.length - 2 : 0];
                    }
                    resolvedCity = candidate;
                } else if (addrParts.length === 1) {
                    resolvedCity = addrParts[0];
                }
            }
            rest.city = resolvedCity || '';
            rest.state = primaryBranch?.location?.state || rest.state || '';
            rest.country = primaryBranch?.location?.country || rest.country || 'India';
            rest.verificationAddress = verifAddress;

            return rest;
        });

        if (nameFixes.length > 0) Promise.allSettled(nameFixes);
        
        res.json(populatedRestaurants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Serve restaurant thumbnail/logo binary image (avoids multi-MB base64 in list APIs)
// @route   GET /api/restaurants/:id/thumbnail
// @access  Public
export const getRestaurantThumbnail = async (req, res) => {
    try {
        const rest = await Restaurant.findById(req.params.id)
            .select('showcaseImages bannerImage image logo')
            .lean();
        if (!rest) return res.status(404).end();

        const wantLogo = req.query.kind === 'logo';
        let raw = wantLogo
            ? (rest.logo && !String(rest.logo).includes('.pdf') ? rest.logo : null)
            : ((Array.isArray(rest.showcaseImages) && rest.showcaseImages[0]) || rest.bannerImage || rest.image || (rest.logo && !String(rest.logo).includes('.pdf') ? rest.logo : null));

        if (!raw) {
            const verif = await RestaurantVerification.findOne({ restaurantId: rest._id })
                .select(wantLogo ? 'documents.logo.filePath' : 'documents.images.filePath documents.logo.filePath')
                .lean();
            raw = wantLogo
                ? verif?.documents?.logo?.filePath
                : (verif?.documents?.images?.[0]?.filePath || verif?.documents?.logo?.filePath);
        }

        if (!raw || typeof raw !== 'string' || raw.includes('.pdf')) {
            return res.status(404).end();
        }

        if (raw.startsWith('data:')) {
            const match = raw.match(/^data:([^;]+);base64,(.+)$/);
            if (!match) return res.status(404).end();
            const buf = Buffer.from(match[2], 'base64');
            res.set('Content-Type', match[1] || 'image/png');
            res.set('Cache-Control', 'public, max-age=86400');
            return res.send(buf);
        }

        return res.redirect(raw);
    } catch (error) {
        return res.status(404).end();
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
// Shared helper to activate a subscription via QR scan / direct plan confirmation
const activateRestaurantPlanPayment = async ({
    restaurant,
    reqUser,
    planName,
    billingCycle = 'monthly',
    transactionId,
    paymentMethod = 'UPI QR'
}) => {
    const pricing = await calculateProratedUpgrade(
        restaurant,
        planName || restaurant.subscription?.plan || 'Basic',
        billingCycle || restaurant.subscription?.billingCycle || 'monthly'
    );

    const expiryDate = applyPaidSubscriptionActivation(restaurant, {
        planName: pricing.planName,
        billingCycle: pricing.billingCycle,
        targetPrice: pricing.targetPrice
    });

    const updatedRestaurant = await restaurant.save();
    const txnId = transactionId || `QR-PAY-${Date.now().toString().slice(-8)}`;

    await SubscriptionPayment.create({
        restaurantId: restaurant._id,
        planName: pricing.planName,
        amount: pricing.chargeAmount,
        billingCycle: pricing.billingCycle,
        paymentMethod,
        transactionId: txnId,
        status: 'Completed',
        effectiveDate: new Date(),
        expiryDate
    });

    await Notification.create({
        title: 'Subscription Activated via UPI QR',
        desc: `Your subscription to the ${pricing.planName} plan has been confirmed and activated (Txn ID: ${txnId}).`,
        type: 'System',
        restaurantId: restaurant._id
    }).catch(() => {});

    broadcastToRestaurant(restaurant._id, 'subscription_updated', {
        restaurantId: String(restaurant._id),
        subscription: updatedRestaurant.subscription
    });

    try {
        const owner = await User.findById(restaurant.ownerId || reqUser?._id).lean();
        const targetEmail = owner?.email || reqUser?.email;
        if (targetEmail) {
            sendSubscriptionSuccessEmail({
                email: targetEmail,
                name: owner?.name || reqUser?.name,
                restaurantName: restaurant.name,
                plan: pricing.planName,
                billingCycle: pricing.billingCycle,
                price: pricing.chargeAmount,
                transactionId: txnId,
                expiryDate
            }).catch(err => console.error('Subscription email background error:', err.message));
        }
    } catch (e) {
        console.error('Failed to send subscription confirmation email:', e.message);
    }

    return {
        updatedRestaurant,
        pricing,
        txnId,
        expiryDate
    };
};

// @desc    Self-subscribe or update restaurant subscription plan (Dummy QR / direct activation)
// @route   PUT /api/restaurants/subscribe
// @access  Private/RestaurantAdmin
export const selfSubscribe = async (req, res) => {
    try {
        const { plan, planName, billingCycle, transactionId } = req.body;
        const restaurant = await Restaurant.findById(req.user.restaurantId);

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        if (restaurant.subscription?.manualFreeze) {
            return res.status(403).json({ message: 'Dashboard is manually frozen by Super Admin. Please contact support.' });
        }

        const { updatedRestaurant } = await activateRestaurantPlanPayment({
            restaurant,
            reqUser: req.user,
            planName: plan || planName || 'Basic',
            billingCycle: billingCycle || 'monthly',
            transactionId,
            paymentMethod: 'UPI QR'
        });

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

        let restaurantId = req.user?.restaurantId;

        // Auto-heal: If user is RestaurantAdmin but has no restaurantId set, find by ownerId
        if (!restaurantId && req.user?._id) {
            const ownedRestaurant = await Restaurant.findOne({ ownerId: req.user._id });
            if (ownedRestaurant) {
                restaurantId = ownedRestaurant._id;
                req.user.restaurantId = ownedRestaurant._id;
                await User.findByIdAndUpdate(req.user._id, { restaurantId: ownedRestaurant._id });
            }
        }

        if (!restaurantId) {
            return res.json(null);
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.json(null);
        }
        
        if (restaurant && restaurant.subscription) {
            const expiryCheckDate = restaurant.subscription.subscriptionEndDate || restaurant.subscription.expiryDate;
            const now = new Date();

            // Auto apply scheduled downgrade if downgrade date has passed
            if (
                restaurant.subscription.downgradeScheduledPlan &&
                restaurant.subscription.downgradeScheduledDate &&
                now >= new Date(restaurant.subscription.downgradeScheduledDate)
            ) {
                const targetPlan = restaurant.subscription.downgradeScheduledPlan;
                const { planName: resolvedTargetName, price: targetPrice } = await resolvePlanPrice(
                    targetPlan,
                    restaurant.subscription.billingCycle || 'monthly'
                );
                restaurant.subscription.plan = resolvedTargetName;
                restaurant.subscription.price = targetPrice;
                restaurant.subscription.downgradeScheduledPlan = '';
                restaurant.subscription.downgradeScheduledDate = null;
                await restaurant.save();

                await Notification.create({
                    title: 'Subscription Downgraded',
                    desc: `Your scheduled downgrade to the ${resolvedTargetName} plan has been processed.`,
                    type: 'System',
                    restaurantId: restaurant._id
                });
            }

            // Evaluate trial/paid expiration uniformly across all expiry fields without mutating manual freeze
            if (expiryCheckDate || restaurant.subscription.trialEndDate) {
                await evaluateSubscriptionAccess(restaurant, { notifyOnExpire: true });
            }
        }
        
        // Auto-initialize restaurantConfig with defaults if missing
        if (!restaurant.restaurantConfig) {
            restaurant.restaurantConfig = {
                orderKitchen: { kitchenMode: restaurant.kitchenMode || 'KDS', kotEnabled: true, kdsEnabled: true, kotPrintEnabled: true },
                waiterTips: { enabled: true, allowCustomerTips: true, tipPercentages: [5, 10, 15, 20], customTipAllowed: true },
                qrOrdering: { enabled: true, allowSelfDineIn: true, allowWaiterOrdering: true },
                paymentMethods: { cash: true, upi: true, card: true, onlineGateway: true },
                setupWizardCompleted: false,
                setupStep: 1
            };
        } else {
            // Guarantee nested objects exist
            if (!restaurant.restaurantConfig.orderKitchen) {
                restaurant.restaurantConfig.orderKitchen = { kitchenMode: restaurant.kitchenMode || 'KDS', kotEnabled: true, kdsEnabled: true, kotPrintEnabled: true };
            } else if (!restaurant.restaurantConfig.orderKitchen.kitchenMode) {
                restaurant.restaurantConfig.orderKitchen.kitchenMode = restaurant.kitchenMode || 'KDS';
            }
            if (!restaurant.restaurantConfig.waiterTips) {
                restaurant.restaurantConfig.waiterTips = { enabled: true, allowCustomerTips: true, tipPercentages: [5, 10, 15, 20], customTipAllowed: true };
            }
            if (!restaurant.restaurantConfig.qrOrdering) {
                restaurant.restaurantConfig.qrOrdering = { enabled: true, allowSelfDineIn: true, allowWaiterOrdering: true };
            }
            if (!restaurant.restaurantConfig.paymentMethods) {
                restaurant.restaurantConfig.paymentMethods = { cash: true, upi: true, card: true, onlineGateway: true };
            }
        }

        // Auto-fallback: populate logo and showcase images from verification if unset
        if (!restaurant.logo || !restaurant.showcaseImages || restaurant.showcaseImages.length === 0) {
            try {
                const verif = await RestaurantVerification.findOne({ restaurantId: restaurant._id })
                    .select('documents.logo.filePath documents.images.filePath')
                    .lean();
                if (!restaurant.logo && verif?.documents?.logo?.filePath) {
                    restaurant.logo = verif.documents.logo.filePath;
                }
                if ((!restaurant.showcaseImages || restaurant.showcaseImages.length === 0) && verif?.documents?.images?.length > 0) {
                    restaurant.showcaseImages = verif.documents.images.map(img => img.filePath);
                }
                if (!restaurant.bannerImage && restaurant.showcaseImages?.length > 0) {
                    restaurant.bannerImage = restaurant.showcaseImages[0];
                }
            } catch (_) {}
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
        
        const { name, contactEmail, phone, address, currency, timezone, features, restaurantConfig } = req.body;
        
        const restaurant = await Restaurant.findById(req.user.restaurantId);
        if (restaurant) {
            restaurant.name = name || restaurant.name;
            restaurant.contactEmail = contactEmail !== undefined ? contactEmail : restaurant.contactEmail;
            restaurant.phone = phone !== undefined ? phone : restaurant.phone;
            restaurant.address = address !== undefined ? address : restaurant.address;
            if (req.body.city) {
                restaurant.city = req.body.city;
            } else if (address) {
                const parts = address.split(',').map(s => s.trim()).filter(Boolean);
                if (parts.length >= 2) {
                    let candidate = parts[parts.length - 1];
                    if (candidate.toLowerCase() === 'tamil nadu' || candidate.toLowerCase() === 'karnataka' || candidate.toLowerCase() === 'india') {
                        candidate = parts[parts.length > 2 ? parts.length - 2 : 0];
                    }
                    restaurant.city = candidate;
                } else if (parts.length === 1) {
                    restaurant.city = parts[0];
                }
            }
            if (req.body.state) restaurant.state = req.body.state;
            if (req.body.country) restaurant.country = req.body.country;
            restaurant.currency = currency || restaurant.currency;
            restaurant.timezone = timezone || restaurant.timezone;
            if (features) {
                restaurant.features = {
                    onlineOrdering: features.onlineOrdering !== undefined ? features.onlineOrdering : restaurant.features?.onlineOrdering,
                    tableReservations: features.tableReservations !== undefined ? features.tableReservations : restaurant.features?.tableReservations
                };
            }
            if (req.body.posConfig) {
                restaurant.posConfig = {
                    ...(restaurant.posConfig ? (restaurant.posConfig.toObject ? restaurant.posConfig.toObject() : restaurant.posConfig) : {}),
                    ...req.body.posConfig
                };
            }

            if (req.body.kitchenMode) {
                restaurant.kitchenMode = req.body.kitchenMode;
                if (!restaurant.restaurantConfig) restaurant.restaurantConfig = {};
                if (!restaurant.restaurantConfig.orderKitchen) restaurant.restaurantConfig.orderKitchen = {};
                restaurant.restaurantConfig.orderKitchen.kitchenMode = req.body.kitchenMode;
                if (req.body.kitchenMode === 'KOT_ONLY') {
                    restaurant.restaurantConfig.orderKitchen.kotEnabled = true;
                    restaurant.restaurantConfig.orderKitchen.kotPrintEnabled = true;
                    restaurant.restaurantConfig.orderKitchen.kdsEnabled = false;
                    if (!restaurant.posConfig) restaurant.posConfig = {};
                    restaurant.posConfig.kdsEnabled = false;
                } else if (req.body.kitchenMode === 'KDS') {
                    restaurant.restaurantConfig.orderKitchen.kdsEnabled = true;
                    if (!restaurant.posConfig) restaurant.posConfig = {};
                    restaurant.posConfig.kdsEnabled = true;
                }
            }

            if (restaurantConfig) {
                if (!restaurant.restaurantConfig) restaurant.restaurantConfig = {};
                if (restaurantConfig.orderKitchen) {
                    restaurant.restaurantConfig.orderKitchen = {
                        ...(restaurant.restaurantConfig.orderKitchen || {}),
                        ...restaurantConfig.orderKitchen
                    };
                    if (restaurantConfig.orderKitchen.kitchenMode) {
                        restaurant.kitchenMode = restaurantConfig.orderKitchen.kitchenMode;
                        if (restaurantConfig.orderKitchen.kitchenMode === 'KOT_ONLY') {
                            restaurant.restaurantConfig.orderKitchen.kotEnabled = true;
                            restaurant.restaurantConfig.orderKitchen.kotPrintEnabled = true;
                            restaurant.restaurantConfig.orderKitchen.kdsEnabled = false;
                            if (!restaurant.posConfig) restaurant.posConfig = {};
                            restaurant.posConfig.kdsEnabled = false;
                        } else if (restaurantConfig.orderKitchen.kitchenMode === 'KDS') {
                            restaurant.restaurantConfig.orderKitchen.kdsEnabled = true;
                            if (!restaurant.posConfig) restaurant.posConfig = {};
                            restaurant.posConfig.kdsEnabled = true;
                        }
                    } else if (restaurantConfig.orderKitchen.kdsEnabled !== undefined) {
                        if (!restaurant.posConfig) restaurant.posConfig = {};
                        restaurant.posConfig.kdsEnabled = restaurantConfig.orderKitchen.kdsEnabled;
                    }
                }
                if (restaurantConfig.waiterTips) {
                    restaurant.restaurantConfig.waiterTips = {
                        ...(restaurant.restaurantConfig.waiterTips || {}),
                        ...restaurantConfig.waiterTips
                    };
                }
                if (restaurantConfig.qrOrdering) {
                    restaurant.restaurantConfig.qrOrdering = {
                        ...(restaurant.restaurantConfig.qrOrdering || {}),
                        ...restaurantConfig.qrOrdering
                    };
                    if (restaurantConfig.qrOrdering.enabled !== undefined) {
                        if (!restaurant.posConfig) restaurant.posConfig = {};
                        restaurant.posConfig.guestQrOrdering = restaurantConfig.qrOrdering.enabled;
                    }
                }
                if (restaurantConfig.paymentMethods) {
                    restaurant.restaurantConfig.paymentMethods = {
                        ...(restaurant.restaurantConfig.paymentMethods || {}),
                        ...restaurantConfig.paymentMethods
                    };
                }
                if (restaurantConfig.setupWizardCompleted !== undefined) {
                    restaurant.restaurantConfig.setupWizardCompleted = Boolean(restaurantConfig.setupWizardCompleted);
                }
                if (restaurantConfig.setupStep !== undefined) {
                    restaurant.restaurantConfig.setupStep = Number(restaurantConfig.setupStep);
                }
                restaurant.markModified('restaurantConfig');
            }

            // Handle logo upload or removal (Base64 data URL, uploaded file, or removal)
            if (req.body.removeLogo === true || req.body.removeLogo === 'true' || req.body.logo === '') {
                restaurant.logo = '';
            } else if (req.body.logoBase64) {
                restaurant.logo = req.body.logoBase64;
            } else if (req.file) {
                restaurant.logo = `/uploads/logos/${req.file.filename}`;
            }

            // Support showcaseImages and menuPdf directly on PUT /api/restaurants/mine
            if (Array.isArray(req.body.showcaseImages)) {
                restaurant.showcaseImages = req.body.showcaseImages;
                if (!restaurant.bannerImage && req.body.showcaseImages.length > 0) {
                    restaurant.bannerImage = req.body.showcaseImages[0];
                }
            }
            if (req.body.bannerImage) {
                restaurant.bannerImage = req.body.bannerImage;
            }

            // Sync with verification documents if present
            try {
                const verif = await RestaurantVerification.findOne({ restaurantId: restaurant._id });
                if (verif) {
                    if (restaurant.logo) {
                        verif.documents.logo = { filePath: restaurant.logo };
                    }
                    if (restaurant.showcaseImages?.length > 0) {
                        verif.documents.images = restaurant.showcaseImages.map(img => ({ filePath: img }));
                    }
                    if (req.body.menuPdf) {
                        verif.documents.menuPdf = { filePath: req.body.menuPdf };
                    }
                    await verif.save();
                }
            } catch (_) {}
            
            const updatedRestaurant = await restaurant.save();

            // Synchronize location to primary branch
            try {
                const Branch = (await import('../models/Branch.js')).default;
                const branch = await Branch.findOne({ restaurantId: restaurant._id });
                if (branch) {
                    branch.location = {
                        ...(branch.location || {}),
                        address: restaurant.address || branch.location?.address || '',
                        city: restaurant.city || branch.location?.city || '',
                        state: restaurant.state || branch.location?.state || '',
                        country: restaurant.country || branch.location?.country || 'India'
                    };
                    await branch.save();
                }
            } catch (_) {}

            res.json(updatedRestaurant);
        } else {
            res.status(404).json({ message: 'Restaurant not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get public configuration for customer QR menu
// @route   GET /api/restaurants/:id/public-config
// @access  Public
export const getRestaurantPublicConfig = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid restaurant ID' });
        }
        const restaurant = await Restaurant.findById(id).select('name logo restaurantConfig posConfig billingConfig deliverySettings status isDeleted isActive approvalStatus');
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        if (restaurant.isDeleted || restaurant.status === 'Deleted') {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        if (restaurant.status === 'Inactive' || restaurant.status === 'Suspended' || !restaurant.isActive || (restaurant.approvalStatus !== 'Approved' && restaurant.approvalStatus !== 'Pending')) {
            return res.status(403).json({ message: 'This restaurant is currently unavailable or inactive.' });
        }

        const config = restaurant.restaurantConfig || {};
        res.json({
            restaurantName: restaurant.name,
            logo: restaurant.logo,
            deliverySettings: restaurant.deliverySettings || { enabled: true },
            qrOrdering: {
                enabled: config.qrOrdering?.enabled ?? true,
                allowSelfDineIn: config.qrOrdering?.allowSelfDineIn ?? true,
                allowWaiterOrdering: config.qrOrdering?.allowWaiterOrdering ?? true
            },
            paymentMethods: {
                cash: config.paymentMethods?.cash ?? true,
                upi: config.paymentMethods?.upi ?? true,
                card: config.paymentMethods?.card ?? true,
                onlineGateway: config.paymentMethods?.onlineGateway ?? true
            },
            waiterTips: {
                enabled: config.waiterTips?.enabled ?? true,
                allowCustomerTips: config.waiterTips?.allowCustomerTips ?? true,
                tipPercentages: config.waiterTips?.tipPercentages || [5, 10, 15, 20],
                customTipAllowed: config.waiterTips?.customTipAllowed ?? true
            },
            orderKitchen: {
                kitchenMode: config.orderKitchen?.kitchenMode || restaurant.kitchenMode || 'KDS',
                kotEnabled: config.orderKitchen?.kotEnabled ?? true,
                kdsEnabled: config.orderKitchen?.kdsEnabled ?? true,
                kotPrintEnabled: config.orderKitchen?.kotPrintEnabled ?? true,
                selfPickup: config.orderKitchen?.selfPickup ?? true,
                homeDelivery: config.orderKitchen?.homeDelivery ?? true
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get authenticated restaurant's operational configuration & plan permissions
// @route   GET /api/restaurants/mine/config
// @access  Private (Admin, Manager)
export const getRestaurantConfig = async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId;
        if (!restaurantId) {
            return res.status(400).json({ message: 'No restaurant associated with this user' });
        }
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const planName = restaurant.subscription?.plan || 'Basic';
        const PlanModel = mongoose.model('Plan');
        const planDoc = await PlanModel.findOne({ name: new RegExp(`^${planName}$`, 'i') });
        const planFeatures = planDoc?.features || [];

        const config = restaurant.restaurantConfig || {
            orderKitchen: { kitchenMode: restaurant.kitchenMode || 'KDS', kotEnabled: true, kdsEnabled: true, kotPrintEnabled: true },
            waiterTips: { enabled: true, allowCustomerTips: true, tipPercentages: [5, 10, 15, 20], customTipAllowed: true },
            qrOrdering: { enabled: true, allowSelfDineIn: true, allowWaiterOrdering: true },
            paymentMethods: { cash: true, upi: true, card: true, onlineGateway: true },
            setupWizardCompleted: false,
            setupStep: 1
        };
        if (!config.orderKitchen.kitchenMode) {
            config.orderKitchen.kitchenMode = restaurant.kitchenMode || 'KDS';
        }

        res.json({
            config,
            planName,
            planFeatures,
            isTrialActive: restaurant.subscription?.trialActive || false
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update authenticated restaurant's operational configuration with validation and plan control
// @route   PUT /api/restaurants/mine/config
// @access  Private (Admin)
export const updateRestaurantConfig = async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId;
        if (!restaurantId) {
            return res.status(400).json({ message: 'No restaurant associated with this user' });
        }
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const { orderKitchen, waiterTips, qrOrdering, paymentMethods, setupWizardCompleted, setupStep, kitchenMode } = req.body;

        // 1. Validation: Prevent saving with zero payment methods
        const currentPm = restaurant.restaurantConfig?.paymentMethods || { cash: true, upi: true, card: true, onlineGateway: true };
        const mergedPm = paymentMethods ? { ...currentPm, ...paymentMethods } : currentPm;
        
        if (paymentMethods && !mergedPm.cash && !mergedPm.upi && !mergedPm.card && !mergedPm.onlineGateway) {
            return res.status(400).json({ 
                message: 'At least one payment method (Cash, UPI, Card, or Online Gateway) must remain enabled.' 
            });
        }

        // 2. Feature Gating vs Subscription Plan
        const planName = restaurant.subscription?.plan || 'Basic';
        const isSuperAdmin = req.user.role === 'SuperAdmin';
        
        if (!isSuperAdmin) {
            const PlanModel = mongoose.model('Plan');
            const planDoc = await PlanModel.findOne({ name: new RegExp(`^${planName}$`, 'i') });
            const planFeatures = planDoc?.features || [];

            const isFeatureAllowed = (featureKeyword) => {
                if (['Pro', 'Enterprise'].includes(planName) && (featureKeyword === 'kds' || featureKeyword === 'tips')) return true;
                return planFeatures.some(f => f.toLowerCase().includes(featureKeyword.toLowerCase()));
            };

            // If attempting to enable KDS when plan forbids it:
            if ((orderKitchen?.kdsEnabled === true || orderKitchen?.kitchenMode === 'KDS' || kitchenMode === 'KDS') && !restaurant.restaurantConfig?.orderKitchen?.kdsEnabled && restaurant.kitchenMode !== 'KDS') {
                if (!isFeatureAllowed('Kitchen Display System') && !isFeatureAllowed('KDS') && planName === 'Basic') {
                    return res.status(403).json({
                        message: `Kitchen Display System (KDS) requires a Pro or Enterprise subscription. Your restaurant is currently on the ${planName} plan.`,
                        requiresUpgrade: true,
                        requiredPlan: 'Pro'
                    });
                }
            }
        }

        // 3. Merge configuration into restaurant document
        if (!restaurant.restaurantConfig) {
            restaurant.restaurantConfig = {
                orderKitchen: { kitchenMode: restaurant.kitchenMode || 'KDS', kotEnabled: true, kdsEnabled: true, kotPrintEnabled: true },
                waiterTips: { enabled: true, allowCustomerTips: true, tipPercentages: [5, 10, 15, 20], customTipAllowed: true },
                qrOrdering: { enabled: true, allowSelfDineIn: true, allowWaiterOrdering: true },
                paymentMethods: { cash: true, upi: true, card: true, onlineGateway: true },
                setupWizardCompleted: false,
                setupStep: 1
            };
        }

        const effectiveKitchenMode = kitchenMode || orderKitchen?.kitchenMode;
        if (effectiveKitchenMode) {
            restaurant.kitchenMode = effectiveKitchenMode;
            if (!restaurant.restaurantConfig.orderKitchen) restaurant.restaurantConfig.orderKitchen = {};
            restaurant.restaurantConfig.orderKitchen.kitchenMode = effectiveKitchenMode;
            if (effectiveKitchenMode === 'KOT_ONLY') {
                restaurant.restaurantConfig.orderKitchen.kotEnabled = true;
                restaurant.restaurantConfig.orderKitchen.kotPrintEnabled = true;
                restaurant.restaurantConfig.orderKitchen.kdsEnabled = false;
                if (!restaurant.posConfig) restaurant.posConfig = {};
                restaurant.posConfig.kdsEnabled = false;
            } else if (effectiveKitchenMode === 'KDS') {
                restaurant.restaurantConfig.orderKitchen.kdsEnabled = true;
                if (!restaurant.posConfig) restaurant.posConfig = {};
                restaurant.posConfig.kdsEnabled = true;
            }
        }

        if (orderKitchen) {
            restaurant.restaurantConfig.orderKitchen = {
                ...(restaurant.restaurantConfig.orderKitchen || {}),
                ...orderKitchen
            };
            if (orderKitchen.kitchenMode && !effectiveKitchenMode) {
                restaurant.kitchenMode = orderKitchen.kitchenMode;
            }
            if (orderKitchen.kdsEnabled !== undefined && !effectiveKitchenMode) {
                if (!restaurant.posConfig) restaurant.posConfig = {};
                restaurant.posConfig.kdsEnabled = orderKitchen.kdsEnabled;
            }
        }

        if (waiterTips) {
            restaurant.restaurantConfig.waiterTips = {
                ...(restaurant.restaurantConfig.waiterTips || {}),
                ...waiterTips
            };
        }

        if (qrOrdering) {
            restaurant.restaurantConfig.qrOrdering = {
                ...(restaurant.restaurantConfig.qrOrdering || {}),
                ...qrOrdering
            };
            if (qrOrdering.enabled !== undefined) {
                if (!restaurant.posConfig) restaurant.posConfig = {};
                restaurant.posConfig.guestQrOrdering = qrOrdering.enabled;
            }
        }

        if (paymentMethods) {
            restaurant.restaurantConfig.paymentMethods = mergedPm;
            if (!restaurant.billingConfig) restaurant.billingConfig = {};
            if (!restaurant.billingConfig.paymentMethods) restaurant.billingConfig.paymentMethods = {};
            restaurant.billingConfig.paymentMethods.cash = mergedPm.cash;
            restaurant.billingConfig.paymentMethods.upi = mergedPm.upi;
            restaurant.billingConfig.paymentMethods.card = mergedPm.card;
        }

        if (setupWizardCompleted !== undefined) {
            restaurant.restaurantConfig.setupWizardCompleted = Boolean(setupWizardCompleted);
        }
        if (setupStep !== undefined) {
            restaurant.restaurantConfig.setupStep = Number(setupStep);
        }

        restaurant.markModified('restaurantConfig');
        restaurant.markModified('posConfig');
        restaurant.markModified('billingConfig');

        await restaurant.save();

        res.json({
            success: true,
            message: 'Restaurant configuration updated successfully',
            config: restaurant.restaurantConfig,
            restaurantConfig: restaurant.restaurantConfig
        });
    } catch (error) {
        console.error('Error updating restaurant config:', error);
        res.status(500).json({ message: error.message || 'Failed to update restaurant configuration' });
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
        const targetRestId = req.params.id;
        if (req.user.role !== 'SuperAdmin' && String(req.user.restaurantId) !== String(targetRestId)) {
            return res.status(403).json({ message: 'Not authorized to create branches for another restaurant.' });
        }

        const restaurant = await Restaurant.findById(targetRestId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        const planName = restaurant.subscription?.plan || 'Basic';
        const planDoc = await findPlanDocument(planName);
        let limit = planDoc?.branchesLimit || 1;
        if (planName.toLowerCase() === 'enterprise') limit = Infinity;
        else if (['pro', 'professional'].includes(planName.toLowerCase())) limit = Math.max(limit, 3);

        const currentCount = await Branch.countDocuments({ restaurantId: targetRestId });
        if (currentCount >= limit) {
            return res.status(403).json({
                message: `Your "${planName}" plan is limited to ${limit} branch(es). Please upgrade to add more branches.`
            });
        }

        const { name, location, contact, manager } = req.body;
        const branch = await Branch.create({
            restaurantId: targetRestId,
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

        // Validate visibility for public customer access
        const isSuperAdminOrStaff = req.user && (
            req.user.role === 'SuperAdmin' || 
            String(req.user.restaurantId) === String(restaurant._id) ||
            String(req.user._id) === String(restaurant.ownerId)
        );

        if (!isSuperAdminOrStaff) {
            if (restaurant.isDeleted || restaurant.status === 'Deleted') {
                return res.status(404).json({ message: 'Restaurant not found' });
            }
            const isSubscribed = (restaurant.subscription?.status && !['Cancelled', 'Frozen', 'Expired', 'Suspended', 'Inactive'].includes(restaurant.subscription.status)) || restaurant.subscription?.trialActive;
            if (restaurant.status === 'Inactive' || restaurant.status === 'Suspended' || !restaurant.isActive || (!isSubscribed && restaurant.approvalStatus !== 'Approved')) {
                return res.status(403).json({ message: 'This restaurant is currently unavailable or inactive.' });
            }
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

        // Attach showcase images and logo from verification if unset
        try {
            const verif = await RestaurantVerification.findOne({ restaurantId: restaurant._id }).lean();
            if (!restaurant.logo && verif?.documents?.logo?.filePath) {
                restaurant.logo = verif.documents.logo.filePath;
            }
            if ((!restaurant.showcaseImages || restaurant.showcaseImages.length === 0) && verif?.documents?.images?.length > 0) {
                restaurant.showcaseImages = verif.documents.images.map(img => img.filePath);
            }
            if (!restaurant.bannerImage && restaurant.showcaseImages?.length > 0) {
                restaurant.bannerImage = restaurant.showcaseImages[0];
            }
        } catch (_) {}
        
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

export const upgradeSubscription = async (req, res) => {
    try {
        const { planName, billingCycle, transactionId } = req.body;
        const restId = req.user.restaurantId || req.user.restaurant;
        const restaurant = restId ? await Restaurant.findById(restId) : await Restaurant.findOne({ ownerId: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant profile not found.' });
        }
        if (restaurant.subscription?.manualFreeze) {
            return res.status(403).json({ message: 'Dashboard is under administrative freeze by Super Admin.' });
        }

        const { updatedRestaurant, pricing, txnId, expiryDate } = await activateRestaurantPlanPayment({
            restaurant,
            reqUser: req.user,
            planName,
            billingCycle,
            transactionId,
            paymentMethod: 'UPI QR'
        });

        res.json({
            paid: true,
            status: 'completed',
            message: `Upgraded to ${pricing.planName} plan successfully!`,
            restaurant: updatedRestaurant,
            transactionId: txnId,
            chargeAmount: pricing.chargeAmount,
            expiryDate
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
        
        let restId = req.user.restaurantId || req.user.restaurant;
        let restaurant;
        if (restId) {
            restaurant = await Restaurant.findById(restId);
        }
        if (!restaurant) {
            restaurant = await Restaurant.findOne({ ownerId: req.user._id });
        }
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant profile not found.' });
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
        const { planName, billingCycle, transactionId } = req.body;
        const restId = req.user.restaurantId || req.user.restaurant;
        const restaurant = restId ? await Restaurant.findById(restId) : await Restaurant.findOne({ ownerId: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant profile not found.' });
        }
        if (restaurant.subscription?.manualFreeze) {
            return res.status(403).json({ message: 'Dashboard is under administrative freeze by Super Admin.' });
        }

        const { updatedRestaurant, pricing, txnId, expiryDate } = await activateRestaurantPlanPayment({
            restaurant,
            reqUser: req.user,
            planName,
            billingCycle,
            transactionId,
            paymentMethod: 'UPI QR'
        });

        res.json({
            paid: true,
            status: 'completed',
            message: `Subscription to ${pricing.planName} plan renewed successfully!`,
            restaurant: updatedRestaurant,
            transactionId: txnId,
            chargeAmount: pricing.chargeAmount,
            expiryDate
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Create Razorpay Order for Subscription Upgrade/Renewal
// @route   POST /api/restaurants/mine/razorpay-order
// @access  Private/RestaurantAdmin
export const createRazorpaySubscriptionOrder = async (req, res) => {
    try {
        const { planName, billingCycle } = req.body;

        let restId = req.user.restaurantId || req.user.restaurant;
        let restaurant = restId ? await Restaurant.findById(restId) : await Restaurant.findOne({ ownerId: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant profile not found.' });
        }

        if (restaurant.subscription?.manualFreeze) {
            return res.status(403).json({
                message: 'Your dashboard is under an administrative freeze by Super Admin. Please contact support.'
            });
        }

        const pricing = await calculateProratedUpgrade(restaurant, planName, billingCycle || 'monthly');
        const { keyId, instance } = getRazorpayInstance();

        const razorpayOrder = await instance.orders.create({
            amount: Math.round(pricing.chargeAmount * 100),
            currency: 'INR',
            receipt: `sub_${restaurant._id.toString().slice(-6)}_${Date.now().toString().slice(-6)}`,
            notes: {
                restaurantId: restaurant._id.toString(),
                planName: pricing.planName,
                billingCycle: pricing.billingCycle
            }
        });

        res.json({
            orderId: razorpayOrder.id,
            amount: pricing.chargeAmount,
            amountPaise: Math.round(pricing.chargeAmount * 100),
            remainingCredit: pricing.remainingCredit,
            targetPrice: pricing.targetPrice,
            currency: 'INR',
            keyId,
            planName: pricing.planName,
            billingCycle: pricing.billingCycle,
            restaurantName: restaurant.name
        });
    } catch (error) {
        console.error('Razorpay Subscription Order Creation Failed:', error);
        res.status(error.statusCode || 400).json({ message: error.message || 'Failed to create Razorpay Order' });
    }
};

// @desc    Verify Razorpay Payment and Activate Subscription
// @route   POST /api/restaurants/mine/razorpay-verify
// @access  Private/RestaurantAdmin
export const verifyRazorpaySubscriptionPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName, billingCycle } = req.body;

        let restId = req.user.restaurantId || req.user.restaurant;
        let restaurant = restId ? await Restaurant.findById(restId) : await Restaurant.findOne({ ownerId: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant profile not found.' });
        }

        if (restaurant.subscription?.manualFreeze) {
            return res.status(403).json({
                message: 'Dashboard is under an administrative freeze by Super Admin. Please contact support.'
            });
        }

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing Razorpay payment verification parameters' });
        }

        if (!verifyRazorpaySignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature })) {
            return res.status(400).json({ message: 'Razorpay payment signature verification failed!' });
        }

        // Prevent duplicate replay of same payment ID
        const existingPayment = await SubscriptionPayment.findOne({ transactionId: razorpay_payment_id, status: 'Completed' }).lean();
        if (existingPayment) {
            return res.json({
                message: `Subscription already activated for transaction ${razorpay_payment_id}.`,
                restaurant,
                transactionId: razorpay_payment_id,
                expiryDate: existingPayment.expiryDate
            });
        }

        const pricing = await calculateProratedUpgrade(
            restaurant,
            planName || restaurant.subscription?.plan || 'Basic',
            billingCycle || restaurant.subscription?.billingCycle || 'monthly'
        );

        const newExpiry = applyPaidSubscriptionActivation(restaurant, {
            planName: pricing.planName,
            billingCycle: pricing.billingCycle,
            targetPrice: pricing.targetPrice
        });
        await restaurant.save();

        const txnId = razorpay_payment_id;
        await SubscriptionPayment.create({
            restaurantId: restaurant._id,
            planName: pricing.planName,
            amount: pricing.chargeAmount,
            billingCycle: pricing.billingCycle,
            paymentMethod: 'Razorpay',
            transactionId: txnId,
            status: 'Completed',
            effectiveDate: new Date(),
            expiryDate: newExpiry
        });

        await Notification.create({
            title: 'Subscription Activated (Razorpay)',
            desc: `Your subscription to the ${pricing.planName} plan has been verified and activated via Razorpay (Txn ID: ${txnId}).`,
            type: 'System',
            restaurantId: restaurant._id
        });

        broadcastToRestaurant(restaurant._id, 'subscription_updated', {
            restaurantId: String(restaurant._id),
            subscription: restaurant.subscription
        });

        try {
            const owner = await User.findById(restaurant.ownerId || req.user._id).lean();
            const targetEmail = owner?.email || req.user?.email;
            if (targetEmail) {
                sendSubscriptionSuccessEmail({
                    email: targetEmail,
                    name: owner?.name || req.user?.name,
                    restaurantName: restaurant.name,
                    plan: pricing.planName,
                    billingCycle: pricing.billingCycle,
                    price: pricing.chargeAmount,
                    transactionId: txnId,
                    expiryDate: newExpiry
                }).catch(err => console.error("Razorpay subscription email background error:", err.message));
            }
        } catch (e) {
            console.error("Failed to send Razorpay email:", e.message);
        }

        res.json({
            message: `Subscription to ${pricing.planName} plan activated successfully!`,
            restaurant,
            transactionId: txnId,
            chargeAmount: pricing.chargeAmount,
            expiryDate: newExpiry
        });
    } catch (error) {
        res.status(error.statusCode || 400).json({ message: error.message });
    }
};

// @desc    Generate Dummy UPI QR Code for Subscription
// @route   POST /api/restaurants/mine/razorpay-qr
// @access  Private/RestaurantAdmin
export const generateRazorpaySubscriptionQR = async (req, res) => {
    try {
        const { planName, billingCycle } = req.body;
        let restId = req.user.restaurantId || req.user.restaurant;
        const restaurant = restId ? await Restaurant.findById(restId) : await Restaurant.findOne({ ownerId: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        if (restaurant.subscription?.manualFreeze) {
            return res.status(403).json({ message: 'Dashboard is frozen by Super Admin. Contact support.' });
        }

        const pricing = await calculateProratedUpgrade(restaurant, planName, billingCycle || 'monthly');
        const refId = `QR-SUB-${Date.now().toString().slice(-8)}`;
        const upiString = `upi://pay?pa=foodnest@upi&pn=${encodeURIComponent('FoodNest SaaS')}&am=${pricing.chargeAmount}&cu=INR&tn=${encodeURIComponent(`${pricing.planName} Plan (${pricing.billingCycle})`)}`;
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiString)}`;

        res.json({
            qrCodeId: refId,
            qrImageUrl,
            upiString,
            chargeAmount: pricing.chargeAmount,
            remainingCredit: pricing.remainingCredit,
            refId,
            planName: pricing.planName,
            billingCycle: pricing.billingCycle
        });
    } catch (error) {
        console.error('QR Creation Error:', error);
        res.status(error.statusCode || 400).json({ message: error.message || 'Unable to generate QR code.' });
    }
};

// @desc    Confirm Dummy QR Subscription Payment and Activate Plan
// @route   GET /api/restaurants/mine/razorpay-qr-status/:qrId
// @route   POST /api/restaurants/mine/confirm-qr-payment
// @access  Private/RestaurantAdmin
export const confirmSubscriptionQRPayment = async (req, res) => {
    try {
        let restId = req.user.restaurantId || req.user.restaurant;
        const restaurant = restId ? await Restaurant.findById(restId) : await Restaurant.findOne({ ownerId: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        if (restaurant.subscription?.manualFreeze) {
            return res.status(403).json({ message: 'Dashboard is under administrative freeze by Super Admin.' });
        }

        const planName = req.body?.planName || req.query?.planName || restaurant.subscription?.plan || 'Basic';
        const billingCycle = req.body?.billingCycle || req.query?.billingCycle || 'monthly';
        const txnRef = req.params.qrId || req.body?.refId || req.body?.qrCodeId || req.body?.transactionId;

        const { updatedRestaurant, pricing, txnId, expiryDate } = await activateRestaurantPlanPayment({
            restaurant,
            reqUser: req.user,
            planName,
            billingCycle,
            transactionId: txnRef,
            paymentMethod: 'UPI QR'
        });

        res.json({
            paid: true,
            status: 'completed',
            message: `Subscription to ${pricing.planName} plan activated via UPI QR!`,
            restaurant: updatedRestaurant,
            transactionId: txnId,
            chargeAmount: pricing.chargeAmount,
            expiryDate
        });
    } catch (error) {
        res.status(error.statusCode || 400).json({ paid: false, message: error.message });
    }
};

// @desc    Record Failed Subscription Payment Attempt
// @route   POST /api/restaurants/mine/razorpay-failed
// @access  Private/RestaurantAdmin
export const recordFailedSubscriptionPayment = async (req, res) => {
    try {
        const { planName, billingCycle, amount, paymentId, reason } = req.body;
        let restId = req.user.restaurantId || req.user.restaurant;
        const restaurant = restId ? await Restaurant.findById(restId) : await Restaurant.findOne({ ownerId: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const txnId = paymentId || `RZP-FAIL-${Date.now().toString().slice(-8)}`;
        await SubscriptionPayment.create({
            restaurantId: restaurant._id,
            planName: planName || restaurant.subscription?.plan || 'Basic',
            amount: Number(amount) || 0,
            billingCycle: billingCycle || 'monthly',
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
            desc: `Payment attempt failed for ${planName || 'subscription'} (${reason || 'Payment unsuccessful'}). Dashboard remains locked until payment succeeds.`,
            type: 'System',
            restaurantId: restaurant._id
        });

        broadcastToRestaurant(restaurant._id, 'subscription_updated', {
            restaurantId: String(restaurant._id),
            subscription: restaurant.subscription
        });

        res.json({ message: 'Failed payment attempt recorded.', restaurant });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Submit a 7-day free trial subscription request
// @route   POST /api/restaurants/trial-request
// @access  Private (RestaurantAdmin)
export const requestFreeTrial = async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId;
        if (!restaurantId) {
            return res.status(404).json({ message: 'Restaurant not found for this user.' });
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found.' });
        }

        const sub = restaurant.subscription || {};

        // Prevent duplicate trial requests if trial was already completed or active
        if (sub.trialStartDate || (sub.trialActive && sub.trialEndDate && new Date() <= new Date(sub.trialEndDate))) {
            return res.status(400).json({ 
                message: 'Your restaurant has already used or is currently on a 7-Day Free Trial. Please select a subscription plan.' 
            });
        }

        if (sub.status === 'Pending Approval') {
            return res.status(400).json({ 
                message: 'Your free trial subscription request is already pending Super Admin approval.' 
            });
        }

        const requestedPlan = req.body.plan || 'Pro';
        const requestDate = new Date();

        restaurant.subscription = {
            ...sub,
            status: 'Pending Approval',
            plan: requestedPlan,
            trialActive: false,
            trialRequestDate: requestDate,
            paymentStatus: 'Trial',
            manualFreeze: false,
            rejectionReason: '',
            price: 0
        };

        await restaurant.save();

        // Super Admin Notification
        try {
            await Notification.create({
                title: 'New Free Trial Request',
                desc: `Restaurant "${restaurant.name}" requested a 7-Day Free Trial (${requestedPlan} Plan). Pending Super Admin review.`,
                type: 'System',
                isSuperAdminOnly: true
            });
        } catch (notifErr) {
            console.error('Failed to create SuperAdmin trial request notification:', notifErr.message);
        }

        // Email Owner (Trigger 1: Free trial subscription request submitted)
        try {
            const owner = await User.findById(restaurant.ownerId || req.user._id);
            const targetEmail = owner?.email || req.user?.email;
            if (targetEmail) {
                sendTrialRequestSubmittedEmail({
                    email: targetEmail,
                    name: owner?.name || req.user?.name,
                    restaurantName: restaurant.name,
                    requestDate
                }).catch(err => console.error('Trial submitted email error:', err.message));
            }
        } catch (emailErr) {
            console.error('Failed to send trial request email:', emailErr.message);
        }

        res.status(200).json({
            message: '7-Day Free Trial request submitted successfully! It is now pending Super Admin approval. Your 7-day countdown will begin upon approval.',
            restaurant
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
