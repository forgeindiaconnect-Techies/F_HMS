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
        status: { type: String, enum: ['Active', 'Frozen', 'Cancelled', 'Inactive'], default: 'Inactive' },
        plan: { type: String, enum: ['Basic', 'Pro', 'Enterprise', 'Starter', 'Professional'], default: 'Basic' },
        billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
        trialActive: { type: Boolean, default: true },
        expiryDate: { type: Date }
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
        }
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;
