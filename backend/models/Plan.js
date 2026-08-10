import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    monthlyPrice: {
        type: Number,
        required: true,
    },
    yearlyPrice: {
        type: Number,
        required: true,
    },
    features: [{
        type: String
    }],
    branchesLimit: {
        type: Number,
        default: 1
    },
    staffLimit: {
        type: Number,
        default: 5
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Plan = mongoose.model('Plan', planSchema);

export default Plan;
