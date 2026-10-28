import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        index: true,
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
        index: true,
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    leaveType: {
        type: String,
        enum: ['Paid Leave', 'Casual Leave', 'Sick Leave', 'Unpaid Leave', 'Emergency Leave'],
        required: true,
        default: 'Casual Leave',
    },
    isPaid: {
        type: Boolean,
        default: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    daysCount: {
        type: Number,
        required: true,
        min: 0.5,
    },
    reason: {
        type: String,
        required: [true, 'Please provide a reason for the leave request'],
        trim: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
        default: 'Pending',
        index: true,
    },
    appliedAt: {
        type: Date,
        default: Date.now,
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    approvalDate: {
        type: Date,
    },
    managerRemarks: {
        type: String,
        default: '',
        trim: true,
    },
    cancelledAt: {
        type: Date,
    },
    cancellationReason: {
        type: String,
        default: '',
    },
}, { timestamps: true });

// Compound indexes for rapid lookups
leaveSchema.index({ restaurantId: 1, employee: 1, status: 1 });
leaveSchema.index({ restaurantId: 1, branchId: 1, status: 1 });
leaveSchema.index({ restaurantId: 1, startDate: 1, endDate: 1 });

const Leave = mongoose.model('Leave', leaveSchema);

export default Leave;
