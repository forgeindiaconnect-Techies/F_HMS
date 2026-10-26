import mongoose from 'mongoose';

const kotItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    qty: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        default: ''
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem'
    },
    kitchenStation: {
        type: String,
        default: 'Main Kitchen'
    },
    status: {
        type: String,
        enum: ['Pending', 'Preparing', 'Ready', 'Served', 'Cancelled'],
        default: 'Pending'
    }
}, { _id: true });

const kotSchema = new mongoose.Schema({
    kotNumber: {
        type: String,
        required: true,
        index: true
    },
    kotSequence: {
        type: Number,
        required: true,
        index: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    orderNumber: {
        type: String,
        default: ''
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        index: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
        index: true
    },
    tableNumber: {
        type: String,
        default: ''
    },
    orderType: {
        type: String,
        enum: ['Dine In', 'Self-Pickup', 'Delivery', 'Takeaway'],
        default: 'Dine In'
    },
    serviceType: {
        type: String,
        default: 'Waiter Table Service'
    },
    customerName: {
        type: String,
        default: ''
    },
    customerPhone: {
        type: String,
        default: ''
    },
    kitchenStation: {
        type: String,
        required: true,
        default: 'Main Kitchen',
        index: true
    },
    items: [kotItemSchema],
    notes: {
        type: String,
        default: ''
    },
    isAddon: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Pending', 'Preparing', 'Ready', 'Served', 'Cancelled'],
        default: 'Pending',
        index: true
    },
    statusHistory: [
        {
            status: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }
    ],
    prepStartTime: {
        type: Date,
        default: null
    },
    prepReadyTime: {
        type: Date,
        default: null
    },
    servedTime: {
        type: Date,
        default: null
    },
    isPrinted: {
        type: Boolean,
        default: false
    },
    printedAt: {
        type: Date,
        default: null
    },
    printCount: {
        type: Number,
        default: 0
    },
    serverName: {
        type: String,
        default: 'System / Customer'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

// Compound indexes for high-speed scoped queries
kotSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
kotSchema.index({ restaurantId: 1, branchId: 1, status: 1 });
kotSchema.index({ orderId: 1, createdAt: -1 });

const KOT = mongoose.model('KOT', kotSchema);

export default KOT;
