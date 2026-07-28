import mongoose from 'mongoose';

const supportAgentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    workload: {
        type: Number,
        default: 0 // Number of active tickets assigned
    },
    totalResolved: {
        type: Number,
        default: 0
    },
    averageResponseTime: {
        type: Number,
        default: 0 // in minutes
    },
    averageResolutionTime: {
        type: Number,
        default: 0 // in minutes
    }
}, {
    timestamps: true
});

const SupportAgent = mongoose.model('SupportAgent', supportAgentSchema);

export default SupportAgent;
