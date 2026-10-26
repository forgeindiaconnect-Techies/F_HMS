import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
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
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    date: {
        type: Date,
        required: true,
    },
    dateString: {
        type: String, // YYYY-MM-DD format for timezone-safe grouping and uniqueness
        required: true,
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Leave', 'Half-day', 'Holiday'],
        required: true,
        default: 'Present',
    },
    checkIn: {
        type: Date,
    },
    checkOut: {
        type: Date,
    },
    lateMinutes: {
        type: Number,
        default: 0,
    },
    overtimeHours: {
        type: Number,
        default: 0,
    },
    workingHours: {
        type: Number,
        default: 0,
    },
    notes: {
        type: String,
        default: '',
    },
    isCorrected: {
        type: Boolean,
        default: false,
    },
    correctionHistory: [
        {
            previousStatus: String,
            newStatus: String,
            previousCheckIn: Date,
            newCheckIn: Date,
            previousCheckOut: Date,
            newCheckOut: Date,
            correctedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            reason: {
                type: String,
                required: true,
            },
            correctedAt: {
                type: Date,
                default: Date.now,
            },
        }
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

// Prevent duplicate attendance for the same employee on the same date within a restaurant
attendanceSchema.index({ restaurantId: 1, employee: 1, dateString: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
