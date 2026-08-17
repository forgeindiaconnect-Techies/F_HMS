import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    filePath: { type: String, default: '' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    rejectReason: { type: String, default: '' },
    expiryDate: { type: Date } // For FSSAI license
});

const restaurantVerificationSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        unique: true
    },
    documents: {
        fssai: documentSchema,
        businessRegistration: documentSchema,
        panCard: documentSchema,
        aadhaarCard: documentSchema,
        addressProof: {
            filePath: { type: String, default: '' },
            addressText: { type: String, default: '' },
            status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
            rejectReason: { type: String, default: '' }
        },
        bankProof: documentSchema,
        logo: { filePath: { type: String, default: '' } },
        images: [{ filePath: { type: String, default: '' } }],
        menuPdf: { filePath: { type: String, default: '' } }
    },
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Verified', 'Rejected', 'Re-upload Required', 'Expired'],
        default: 'Pending'
    },
    rejectionReason: { type: String, default: '' },
    history: [
        {
            status: { type: String, required: true },
            actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            actionDate: { type: Date, default: Date.now },
            reason: { type: String, default: '' },
            comments: { type: String, default: '' }
        }
    ]
}, { timestamps: true });

const RestaurantVerification = mongoose.model('RestaurantVerification', restaurantVerificationSchema);

export default RestaurantVerification;
