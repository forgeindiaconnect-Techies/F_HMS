import mongoose from 'mongoose';

const customerReviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerEmail: {
        type: String,
        default: ''
    },
    avatar: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 5
    },
    reviewText: {
        type: String,
        required: true,
        trim: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    status: {
        type: String,
        enum: ['Approved', 'Pending', 'Hidden'],
        default: 'Approved' // auto-approved for instant visibility on landing page
    }
}, {
    timestamps: true
});

customerReviewSchema.index({ status: 1, createdAt: -1 });

const CustomerReview = mongoose.model('CustomerReview', customerReviewSchema);

export default CustomerReview;
