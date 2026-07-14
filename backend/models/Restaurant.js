import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
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
        status: { type: String, enum: ['Active', 'Frozen', 'Cancelled'], default: 'Active' },
        plan: { type: String, enum: ['Basic', 'Pro', 'Enterprise'], default: 'Basic' },
        billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
        expiryDate: { type: Date }
    },
    approvalStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    commissionRate: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;
