import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
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
    inventoryItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true,
        index: true,
    },
    itemName: {
        type: String,
        required: true,
    },
    movementType: {
        type: String,
        enum: ['Purchase Received', 'Stock Consumed', 'Damaged', 'Wastage', 'Stock Adjustment', 'Return'],
        required: true,
    },
    quantityChanged: {
        type: Number,
        required: true, // Positive for inward, negative for outward
    },
    previousQuantity: {
        type: Number,
        required: true,
    },
    newQuantity: {
        type: Number,
        required: true,
    },
    unit: {
        type: String,
        required: true,
    },
    unitCost: {
        type: Number,
        default: 0,
    },
    totalValue: {
        type: Number,
        default: 0,
    },
    reference: {
        type: String, // e.g. "Invoice #INV-204", "Kitchen Daily Consumption", "Stock Adjustment"
        default: '',
    },
    reason: {
        type: String,
        default: '',
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    date: {
        type: Date,
        default: Date.now,
        index: true,
    },
}, { timestamps: true });

stockMovementSchema.index({ restaurantId: 1, inventoryItem: 1, date: -1 });

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

export default StockMovement;
