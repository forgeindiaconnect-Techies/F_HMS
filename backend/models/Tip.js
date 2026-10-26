import mongoose from 'mongoose';

const tipSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        index: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        index: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        index: true
    },
    waiterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    waiterName: {
        type: String,
        default: 'Unassigned Waiter'
    },
    tableNumber: {
        type: String,
        default: ''
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        default: 'UPI'
    },
    source: {
        type: String,
        enum: ['Customer QR', 'Cashier Settlement', 'Card Machine', 'Manual Recorded Settlement'],
        default: 'Customer QR'
    },
    status: {
        type: String,
        enum: ['Pending', 'Settled'],
        default: 'Pending',
        index: true
    },
    settledAt: {
        type: Date
    },
    settledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    transactionReference: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    }
}, { timestamps: true });

const Tip = mongoose.model('Tip', tipSchema);

export default Tip;
