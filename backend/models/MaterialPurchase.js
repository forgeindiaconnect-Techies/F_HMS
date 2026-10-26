import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema({
    material: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: false,
    },
    itemName: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        default: 'General',
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    unit: {
        type: String,
        required: true,
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    taxPercent: {
        type: Number,
        default: 0,
    },
    taxAmount: {
        type: Number,
        default: 0,
    },
    totalCost: {
        type: Number,
        required: true,
        min: 0,
    },
}, { _id: true });

const materialPurchasePaymentSchema = new mongoose.Schema({
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
        enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Credit'],
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

const materialPurchaseSchema = new mongoose.Schema({
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
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
    },
    supplierName: {
        type: String,
        default: 'Unknown Supplier',
    },
    supplierPhone: {
        type: String,
        default: '',
    },
    invoiceNumber: {
        type: String,
        required: true,
    },
    purchaseDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    items: [purchaseItemSchema],
    subtotal: {
        type: Number,
        required: true,
        default: 0,
    },
    taxAmount: {
        type: Number,
        default: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0,
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
        enum: ['Unpaid', 'Partially Paid', 'Paid'],
        default: 'Unpaid',
    },
    payments: [materialPurchasePaymentSchema],
    notes: {
        type: String,
        default: '',
    },
    linkedExpenseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

materialPurchaseSchema.index({ restaurantId: 1, invoiceNumber: 1 });
materialPurchaseSchema.index({ restaurantId: 1, purchaseDate: -1 });

const MaterialPurchase = mongoose.model('MaterialPurchase', materialPurchaseSchema);

export default MaterialPurchase;
