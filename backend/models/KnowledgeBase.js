import mongoose from 'mongoose';

const knowledgeBaseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: [
            'Getting Started',
            'Subscription',
            'Orders',
            'POS',
            'QR Digital Menu',
            'Kitchen',
            'Inventory',
            'Payments',
            'Delivery',
            'Troubleshooting',
            'FAQs'
        ],
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    helpfulVotes: {
        type: Number,
        default: 0
    },
    unhelpfulVotes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);

export default KnowledgeBase;
