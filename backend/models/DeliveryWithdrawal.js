import mongoose from 'mongoose';

const deliveryWithdrawalSchema = new mongoose.Schema({
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    payoutDetails: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const DeliveryWithdrawal = mongoose.model('DeliveryWithdrawal', deliveryWithdrawalSchema);

export default DeliveryWithdrawal;
