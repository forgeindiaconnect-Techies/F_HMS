import mongoose from 'mongoose';

const payrollPaymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    paymentDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque'],
        default: 'Bank Transfer',
        required: true,
    },
    reference: {
        type: String,
        default: '',
    },
    notes: {
        type: String,
        default: '',
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { _id: true, timestamps: true });

const payrollSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        index: true,
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        index: true,
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    month: {
        type: Number, // 1 to 12
        required: true,
    },
    year: {
        type: Number, // e.g., 2026
        required: true,
    },
    periodString: {
        type: String, // e.g., "2026-10"
        required: true,
    },
    payPeriod: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
    },
    salaryFrequency: {
        type: String,
        enum: ['Monthly', 'Daily', 'Hourly'],
        default: 'Monthly',
    },
    basicSalary: {
        type: Number,
        required: true,
        default: 0,
    },
    attendanceSummary: {
        presentDays: { type: Number, default: 0 },
        absentDays: { type: Number, default: 0 },
        leaveDays: { type: Number, default: 0 },
        halfDays: { type: Number, default: 0 },
        holidays: { type: Number, default: 0 },
        overtimeHours: { type: Number, default: 0 },
        totalWorkingDays: { type: Number, default: 26 },
    },
    calculations: {
        earnedBasic: { type: Number, default: 0 },
        overtimePay: { type: Number, default: 0 },
        bonuses: { type: Number, default: 0 },
        allowances: { type: Number, default: 0 },
        grossSalary: { type: Number, default: 0 },
        deductions: { type: Number, default: 0 },
        advances: { type: Number, default: 0 },
        netSalaryPayable: { type: Number, default: 0 },
    },
    paidAmount: {
        type: Number,
        default: 0,
    },
    balanceDue: {
        type: Number,
        default: 0,
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Partially Paid', 'Paid'],
        default: 'Pending',
    },
    payments: [payrollPaymentSchema],
    status: {
        type: String,
        enum: ['Draft', 'Approved', 'Processed'],
        default: 'Draft',
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    approvedAt: {
        type: Date,
    },
    notes: {
        type: String,
        default: '',
    },
}, { timestamps: true });

// Prevent duplicate payroll for the same employee in the same period
payrollSchema.index({ restaurantId: 1, employee: 1, month: 1, year: 1 }, { unique: true });

const Payroll = mongoose.model('Payroll', payrollSchema);

export default Payroll;
