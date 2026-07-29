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
        enum: ['Dine In', 'Self-Pickup', 'Delivery'],
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
    subscriptionPlan: {
        type: String,
        default: 'One-time Order',
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
        enum: ['Pending', 'Accepted', 'Preparing', 'Ready', 'Ready for Pickup', 'Picked Up', 'Served', 'Billing Requested', 'Out for Delivery', 'Delivered', 'Cancelled', 'Completed'],
        default: 'Pending'
    },
    statusHistory: [
        {
            status: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }
    ],
    pickupTime: {
        type: Date
    },
    // Delivery partner details
    deliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deliveryStatus: {
        type: String,
        enum: ['None', 'Pending Assignment', 'Accepted', 'Rejected', 'Picked Up', 'On the Way', 'Delivered', 'Cancelled'],
        default: 'None'
    },
    deliveryDistance: {
        type: Number,
        default: 0
    },
    deliveryCharge: {
        type: Number,
        default: 0
    },
    deliveryETA: {
        type: Date
    },
    deliveryRating: {
        speed: { type: Number, default: 0 },
        behaviour: { type: Number, default: 0 },
        foodHandling: { type: Number, default: 0 },
        overall: { type: Number, default: 0 },
        review: { type: String, default: '' }
    },
    internalRating: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;
