import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
    },
    address: {
        type: String,
    },
    logo: {
        type: String,
    },
    currency: {
        type: String,
        default: 'USD',
    },
    contactEmail: {
        type: String,
    },
    timezone: {
        type: String,
        default: 'America/New_York (EST)',
    },
    features: {
        onlineOrdering: { type: Boolean, default: true },
        tableReservations: { type: Boolean, default: true }
    },
    taxRate: {
        type: Number,
        default: 0,
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    subscription: {
        status: { type: String, enum: ['Active', 'Frozen', 'Cancelled', 'Inactive', 'Expiring Soon', 'Expired', 'Suspended'], default: 'Inactive' },
        plan: {
            type: String,
            enum: ['Basic', 'Pro', 'Enterprise', 'Starter', 'Professional', 'basic', 'pro', 'enterprise', 'starter', 'professional'],
            set: (v) => {
                if (!v) return 'Basic';
                const lower = String(v).trim().toLowerCase();
                if (lower === 'basic') return 'Basic';
                if (lower === 'pro' || lower === 'professional') return 'Pro';
                if (lower === 'enterprise') return 'Enterprise';
                if (lower === 'starter') return 'Starter';
                return v.charAt(0).toUpperCase() + v.slice(1);
            },
            default: 'Basic'
        },
        billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
        trialActive: { type: Boolean, default: true },
        expiryDate: { type: Date },
        startDate: { type: Date, default: Date.now },
        price: { type: Number, default: 0 },
        downgradeScheduledPlan: { type: String, default: '' },
        downgradeScheduledDate: { type: Date }
    },
    approvalStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    verificationStatus: {
        type: String,
        enum: ['Pending', 'Under Review', 'Verified', 'Rejected', 'Re-upload Required', 'Expired'],
        default: 'Pending'
    },
    commissionRate: {
        type: Number,
        default: 0
    },
    deliverySettings: {
        deliveryType: { type: String, enum: ['Self', 'Third-Party', 'Both'], default: 'Both' },
        enabled: { type: Boolean, default: false },
        radius: { type: Number, default: 5 },
        freeRadius: { type: Number, default: 2 },
        baseFee: { type: Number, default: 30 },
        perKmCharge: { type: Number, default: 10 },
        peakHourFee: { type: Number, default: 15 },
        rainSurcharge: { type: Number, default: 20 },
        minOrderAmountForFreeDelivery: { type: Number, default: 300 },
        minOrderAmountForDelivery: { type: Number, default: 0 },
        deliveryOperatingHours: {
            start: { type: String, default: '09:00' },
            end: { type: String, default: '22:00' }
        },
        location: {
            latitude: { type: Number, default: 13.0475 },
            longitude: { type: Number, default: 80.2090 }
        }
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    posConfig: {
        outletFormat: { type: String, default: 'Fine Dine & Resto-Bar' },
        tablesEnabled: { type: Boolean, default: true },
        qsrCounterMode: { type: Boolean, default: false },
        kdsEnabled: { type: Boolean, default: true },
        inventoryAutoDeduct: { type: Boolean, default: true },
        deliveryFleetEnabled: { type: Boolean, default: true },
        loyaltyPointsEnabled: { type: Boolean, default: true },
        whatsappPnlAlerts: { type: Boolean, default: true },
        happyHoursEnabled: { type: Boolean, default: true },
        serviceChargePercent: { type: Number, default: 5 },
        barcodeScannerEnabled: { type: Boolean, default: false },
        guestQrOrdering: { type: Boolean, default: true }
    },
    billingConfig: {
        isCustomBillingActive: { type: Boolean, default: false },
        activatedAt: { type: Date, default: null },
        demoRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'BillingDemoRequest', default: null },
        outletFormat: { type: String, default: 'Fine Dine & Resto-Bar' },
        modules: {
            posBilling: { type: Boolean, default: true },
            menuManagement: { type: Boolean, default: true },
            tableManagement: { type: Boolean, default: true },
            dineInTakeawayOrders: { type: Boolean, default: true },
            kitchenOrderManagement: { type: Boolean, default: true },
            gstInvoice: { type: Boolean, default: true },
            discounts: { type: Boolean, default: true },
            customerManagement: { type: Boolean, default: true },
            inventoryManagement: { type: Boolean, default: true },
            salesReports: { type: Boolean, default: true },
            staffManagement: { type: Boolean, default: true }
        },
        paymentMethods: {
            cash: { type: Boolean, default: true },
            upi: { type: Boolean, default: true },
            card: { type: Boolean, default: true },
            split: { type: Boolean, default: true }
        },
        serviceChargePercent: { type: Number, default: 5 },
        gstRatePercent: { type: Number, default: 5 }
    },
}, { timestamps: true });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;
