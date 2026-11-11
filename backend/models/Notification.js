import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    desc: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['Alert', 'Info', 'Broadcast', 'System', 'Order'],
        default: 'Info',
    },
    read: {
        type: Boolean,
        default: false,
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    // Role-scoping: if set, only these roles can see this notification
    targetRole: {
        type: [String],
        default: null,
    },
    // If true, only SuperAdmin can see this (no restaurantId needed)
    isSuperAdminOnly: {
        type: Boolean,
        default: false,
    },
    // Structured metadata (e.g., kitchen restock request / admin order confirmation)
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
