import mongoose from 'mongoose';

const supportAnnouncementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: [
            'Scheduled Maintenance',
            'Feature Releases',
            'Service Updates',
            'Known Issues'
        ],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const SupportAnnouncement = mongoose.model('SupportAnnouncement', supportAnnouncementSchema);

export default SupportAnnouncement;
