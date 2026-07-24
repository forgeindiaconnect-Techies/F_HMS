import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    tableNumber: {
        type: Number,
        required: true
    },
    requestType: {
        type: String,
        enum: ['Call Waiter', 'Request Water', 'Request Cutlery', 'Request Bill'],
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed'],
        default: 'Pending'
    }
}, { timestamps: true });

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
export default ServiceRequest;
