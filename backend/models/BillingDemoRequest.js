import mongoose from 'mongoose';

const billingDemoRequestSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    restaurantName: {
        type: String,
        required: [true, 'Restaurant name is required'],
        trim: true
    },
    city: {
        type: String,
        default: 'N/A',
        trim: true
    },
    outletFormat: {
        type: String,
        default: 'Fine Dine & Resto-Bar',
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Contacted', 'Demo Scheduled', 'Demo Completed', 'Activated', 'Rejected'],
        default: 'Pending'
    },
    notes: {
        type: String,
        default: ''
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        default: null
    },
    customBillingConfig: {
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
    activatedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

billingDemoRequestSchema.index({ phoneNumber: 1, status: 1 });
billingDemoRequestSchema.index({ createdAt: -1 });

const BillingDemoRequest = mongoose.model('BillingDemoRequest', billingDemoRequestSchema);

export default BillingDemoRequest;
