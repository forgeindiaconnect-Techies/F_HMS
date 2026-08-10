import mongoose from 'mongoose';

const subscriptionPaymentSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    planName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    transactionId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Completed'
    },
    effectiveDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date
    }
}, {
    timestamps: true
});

const SubscriptionPayment = mongoose.model('SubscriptionPayment', subscriptionPaymentSchema);

export default SubscriptionPayment;
