import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    subject: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: [
            'Billing',
            'Subscription',
            'Orders',
            'Kitchen',
            'Inventory',
            'POS',
            'QR Digital Menu',
            'Delivery',
            'Staff Management',
            'Technical Issue',
            'Feature Request',
            'Other'
        ],
        required: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Open', 'Assigned', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'],
        default: 'Open'
    },
    description: {
        type: String,
        required: true
    },
    assignedAgentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    attachments: [{
        type: String
    }],
    resolutionTime: {
        type: Number, // in minutes
        default: null
    },
    csatRating: {
        type: Number, // 1 to 5 stars
        min: 1,
        max: 5,
        default: null
    },
    csatFeedback: {
        type: String,
        default: ''
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Middleware to update lastUpdated on changes
ticketSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
