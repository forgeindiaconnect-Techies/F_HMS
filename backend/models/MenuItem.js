import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: '',
    },
    rating: {
        type: Number,
        default: 0,
    },
    reviews: {
        type: Number,
        default: 0,
    },
    tags: [{
        type: String,
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    kitchenStation: {
        type: String,
        default: 'Main Kitchen',
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
    }
}, { timestamps: true });

menuItemSchema.index({ restaurantId: 1, isActive: 1 });
menuItemSchema.index({ isActive: 1 });
menuItemSchema.index({ branchId: 1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
