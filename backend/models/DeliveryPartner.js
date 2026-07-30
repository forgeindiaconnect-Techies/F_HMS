import mongoose from 'mongoose';

const deliveryPartnerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    status: {
        type: String,
        enum: ['Online', 'Offline', 'Busy', 'On Delivery'],
        default: 'Offline'
    },
    verificationStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Suspended'],
        default: 'Pending'
    },
    vehicleDetails: {
        type: { type: String, default: 'Bike' }, // Bike, Scooter, Car, etc.
        model: { type: String, default: '' },
        rcNumber: { type: String, default: '' },
        licenseNumber: { type: String, default: '' }
    },
    documents: {
        drivingLicense: { type: String, default: '' },
        aadhaarProof: { type: String, default: '' },
        vehicleRc: { type: String, default: '' },
        vehicleInsurance: { type: String, default: '' },
        profilePhoto: { type: String, default: '' }
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    earnings: {
        type: Number,
        default: 0
    },
    currentLocation: {
        latitude: { type: Number, default: 12.9716 }, // Defaults to center coordinates
        longitude: { type: Number, default: 77.5946 }
    }
}, { timestamps: true });

const DeliveryPartner = mongoose.model('DeliveryPartner', deliveryPartnerSchema);

export default DeliveryPartner;
