import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        index: true,
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
        index: true,
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
    },
    itemName: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String, // e.g., 'Vegetables', 'Meat', 'Dairy', 'Packaging', 'Spices', 'Beverages'
        default: 'General',
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    unit: {
        type: String, // e.g., 'kg', 'g', 'ltr', 'ml', 'pcs', 'box', 'packet'
        required: true,
    },
    minStockLevel: {
        type: Number,
        default: 10,
    },
    reorderQuantity: {
        type: Number,
        default: 20,
    },
    pricePerUnit: {
        type: Number,
        default: 0,
    },
    lastPurchasePrice: {
        type: Number,
        default: 0,
    },
    lastPurchaseDate: {
        type: Date,
    },
    costingMethod: {
        type: String,
        enum: ['Weighted Average', 'Latest Price'],
        default: 'Weighted Average',
    },
    description: {
        type: String,
        default: '',
    },
}, { timestamps: true });

// Virtual for total valuation
inventorySchema.virtual('valuation').get(function () {
    return (this.quantity || 0) * (this.pricePerUnit || 0);
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
