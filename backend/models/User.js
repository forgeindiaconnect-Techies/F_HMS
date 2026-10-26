import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
    },
    role: {
        type: String,
        required: true,
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    employeeId: {
        type: String,
        trim: true,
    },
    joiningDate: {
        type: Date,
        default: Date.now,
    },
    employmentStatus: {
        type: String,
        enum: ['Active', 'On Leave', 'Terminated', 'Probation'],
        default: 'Active',
    },
    salaryConfig: {
        basicSalary: { type: Number, default: 0 },
        salaryFrequency: { type: String, enum: ['Monthly', 'Daily', 'Hourly'], default: 'Monthly' },
        overtimeRatePerHour: { type: Number, default: 0 },
        dailyWorkHours: { type: Number, default: 8 },
        monthlyWorkingDays: { type: Number, default: 26 },
        allowances: { type: mongoose.Schema.Types.Mixed, default: [] },
        deductions: { type: mongoose.Schema.Types.Mixed, default: [] },
    },
    bankDetails: {
        accountName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        bankName: { type: String, default: '' },
        ifscCode: { type: String, default: '' },
        upiId: { type: String, default: '' },
    },
    refreshToken: {
        type: String,
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
