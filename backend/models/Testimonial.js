import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // One testimonial per restaurant owner
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    ownerName: {
        type: String,
        required: true,
        trim: true
    },
    restaurantName: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    quote: {
        type: String,
        required: true,
        trim: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 5
    },
    avatar: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    approvedAt: {
        type: Date
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index to quickly fetch published testimonials sorted by latest approved
testimonialSchema.index({ status: 1, createdAt: -1 });

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

export default Testimonial;
