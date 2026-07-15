import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    orderItems: [
        {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'MenuItem',
            },
        }
    ],
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
    },
    source: {
        type: String,
        enum: ['Walk-in', 'QR', 'Self-Pickup'],
        default: 'Walk-in'
    },
    orderType: {
        type: String,
        required: true,
        enum: ['Dine In', 'Self-Pickup'],
        default: 'Dine In'
    },
    tableNumber: {
        type: String,
    },
    notes: {
        type: String,
    },
    shippingAddress: {
        address: { type: String },
        city: { type: String },
        postalCode: { type: String },
    },
    paymentMethod: {
        type: String,
        required: true,
        default: 'Card',
    },
    paymentResult: {
        id: { type: String },
        status: { type: String },
        update_time: { type: String },
        email_address: { type: String },
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    isPaid: {
        type: Boolean,
        required: true,
        default: false,
    },
    paidAt: {
        type: Date,
    },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Preparing', 'Ready', 'Served', 'Billing Requested', 'Out for Delivery', 'Delivered'],
        default: 'Pending'
    },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;
