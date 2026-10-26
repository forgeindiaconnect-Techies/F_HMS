import mongoose from 'mongoose';

const expensePaymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    paidDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque', 'Other'],
        default: 'Cash',
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
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { _id: true, timestamps: true });

const expenseSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: [
            'Rent',
            'Electricity',
            'Water',
            'Internet',
            'Material purchases',
            'Staff salary',
            'Equipment maintenance',
            'Delivery and transport',
            'Kitchen Supplies',
            'Utility Bill',
            'Maintenance',
            'Staff Welfare',
            'Marketing',
            'Other operating expenses',
            'Others'
        ],
        index: true,
    },
    title: {
        type: String,
        default: '',
        trim: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    description: {
        type: String,
        default: '',
        trim: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
    },
    dueDate: {
        type: Date,
    },
    billingPeriod: {
        type: String, // e.g., "October 2026"
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Partially Paid', 'Paid', 'Overdue'],
        default: 'Paid', // Default Paid for backward compatibility with existing recorded expenses
        index: true,
    },
    paidAmount: {
        type: Number,
        default: function () {
            // If paymentStatus is Paid, default to full amount
            return this.paymentStatus === 'Paid' ? this.amount : 0;
        },
    },
    balanceDue: {
        type: Number,
        default: 0,
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque', 'Other'],
        default: 'Cash',
    },
    paymentDate: {
        type: Date,
    },
    payments: [expensePaymentSchema],
    isRecurring: {
        type: Boolean,
        default: false,
    },
    recurringFrequency: {
        type: String,
        enum: ['Monthly', 'Quarterly', 'Yearly'],
    },
    recurringKey: {
        type: String, // format: "category_branchId_YYYY-MM" to prevent duplicate recurring bills
        sparse: true,
    },
    receiptUrl: {
        type: String,
        default: '',
    },
    notes: {
        type: String,
        default: '',
    },
    source: {
        type: String,
        enum: ['Manual', 'Material Purchase', 'Payroll', 'Recurring'],
        default: 'Manual',
    },
    sourceId: {
        type: mongoose.Schema.Types.ObjectId, // Link to MaterialPurchase or Payroll to prevent double-counting
    },
    staff: {
        type: String,
        required: true,
        default: 'Staff',
    },
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
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

expenseSchema.pre('save', function (next) {
    if (!this.title && this.description) {
        this.title = this.description;
    }
    if (!this.description && this.title) {
        this.description = this.title;
    }
    next();
});

expenseSchema.index({ restaurantId: 1, date: -1 });
expenseSchema.index({ restaurantId: 1, category: 1, date: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
