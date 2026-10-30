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
        enum: [
            'Pending', 
            'Contacted', 
            'Demo Scheduled', 
            'Requirements Collected', 
            'Proposal Sent', 
            'Payment Pending', 
            'Payment Verified', 
            'Activated', 
            'Rejected'
        ],
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
            dineInTakeawayOrders: { type: Boolean, default: true },
            kot: { type: Boolean, default: true },
            kds: { type: Boolean, default: true },
            menuManagement: { type: Boolean, default: true },
            inventoryManagement: { type: Boolean, default: true },
            rawMaterials: { type: Boolean, default: true },
            staffManagement: { type: Boolean, default: true },
            attendance: { type: Boolean, default: true },
            payroll: { type: Boolean, default: true },
            reports: { type: Boolean, default: true },
            salesReports: { type: Boolean, default: true }, // Alias / legacy compatibility
            expenseManagement: { type: Boolean, default: true },
            tableManagement: { type: Boolean, default: true },
            reservations: { type: Boolean, default: true },
            deliveryManagement: { type: Boolean, default: true },
            customerManagement: { type: Boolean, default: true },
            branchManagement: { type: Boolean, default: true },
            qrOrdering: { type: Boolean, default: true },
            onlineOrdering: { type: Boolean, default: true },
            gstInvoice: { type: Boolean, default: true },
            discounts: { type: Boolean, default: true }
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
    customPlan: {
        planName: { type: String, default: 'Custom Tailored Plan' },
        billingCycle: { type: String, enum: ['monthly', 'quarterly', 'half-yearly', 'yearly'], default: 'yearly' },
        durationMonths: { type: Number, default: 12 },
        branchLimit: { type: Number, default: 1 },
        staffLimit: { type: Number, default: 10 },
        basePrice: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        finalAmount: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
        internalNotes: { type: String, default: '' },
        modulePricing: { type: Map, of: Number, default: {} },
        proposalSentAt: { type: Date, default: null }
    },
    paymentDetails: {
        paymentMethod: { type: String, default: 'UPI' },
        transactionId: { type: String, default: '' },
        amountPaid: { type: Number, default: 0 },
        paidAt: { type: Date, default: null },
        isVerified: { type: Boolean, default: false },
        verifiedAt: { type: Date, default: null },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    activation: {
        token: { type: String, default: null },
        tokenExpires: { type: Date, default: null },
        invitationSentAt: { type: Date, default: null },
        isActivated: { type: Boolean, default: false },
        activatedAt: { type: Date, default: null }
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
billingDemoRequestSchema.index({ 'activation.token': 1 });

const BillingDemoRequest = mongoose.model('BillingDemoRequest', billingDemoRequestSchema);

export default BillingDemoRequest;
