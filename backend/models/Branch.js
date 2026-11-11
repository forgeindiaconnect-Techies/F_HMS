import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    location: {
        address: String,
        city: String,
        state: String,
        zip: String,
        country: String,
    },
    contact: {
        phone: String,
        email: String,
    },
    operatingHours: {
        open: {
            type: String,
            default: '08:00',
        },
        close: {
            type: String,
            default: '22:00',
        },
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

const Branch = mongoose.model('Branch', branchSchema);

export default Branch;
