import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['Kitchen Supplies', 'Utility Bill', 'Maintenance', 'Staff Welfare', 'Marketing', 'Others']
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    staff: {
        type: String,
        required: true
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
