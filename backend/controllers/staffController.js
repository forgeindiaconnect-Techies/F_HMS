import mongoose from 'mongoose';
import User from '../models/User.js';
import Branch from '../models/Branch.js';
import Restaurant from '../models/Restaurant.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Plan from '../models/Plan.js';
import Attendance from '../models/Attendance.js';
import Payroll from '../models/Payroll.js';
import Expense from '../models/Expense.js';
import Leave from '../models/Leave.js';

// Helper to resolve user's restaurantId safely
const getUserRestaurantId = async (user, queryOrBody = {}) => {
    let rId = user?.restaurantId || user?.restaurant;
    if (!rId && user?.branchId) {
        const branchDoc = await Branch.findById(user.branchId);
        if (branchDoc) rId = branchDoc.restaurantId;
    }
    // Only SuperAdmin is allowed to query other restaurant's staff / payroll
    if (user?.role === 'SuperAdmin' && queryOrBody?.restaurantId) {
        rId = queryOrBody.restaurantId;
    }
    if (!rId && user?.role === 'SuperAdmin') {
        const firstRest = await Restaurant.findOne().select('_id');
        if (firstRest) rId = firstRest._id;
    }
    return rId;
};

// ─── STAFF PROFILE CRUD ───────────────────────────────────────────────────────

// @desc    Get all staff for a restaurant
// @route   GET /api/staff
// @access  Private
export const getStaff = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const restaurant = await Restaurant.findById(restaurantId);
        const hasEnterprise = restaurant?.subscription?.plan === 'Enterprise';

        const staffRoles = hasEnterprise
            ? ['BranchManager', 'Manager', 'Chef', 'Waiter', 'Cashier', 'DeliveryPartner', 'Staff']
            : ['BranchManager', 'Manager', 'Chef', 'Waiter', 'Cashier', 'Staff'];
        
        const filter = {
            restaurantId,
            role: { $in: staffRoles }
        };

        if (req.query.role && req.query.role !== 'All') {
            if (req.query.role === 'Manager' || req.query.role === 'BranchManager') {
                filter.role = { $in: ['BranchManager', 'Manager'] };
            } else {
                filter.role = req.query.role;
            }
        }

        if (req.user.role === 'BranchManager' && req.user.branchId) {
            filter.branchId = req.user.branchId;
        } else if (req.query.branchId && req.query.branchId !== 'All') {
            filter.branchId = req.query.branchId;
        }

        if (req.query.employmentStatus && req.query.employmentStatus !== 'All') {
            filter.employmentStatus = req.query.employmentStatus;
        }

        const staff = await User.find(filter)
            .populate('branchId', 'name')
            .select('-password')
            .sort({ name: 1 });
        
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const normalizeSalaryConfig = (config) => {
    if (!config) {
        return {
            basicSalary: 0,
            salaryFrequency: 'Monthly',
            overtimeRatePerHour: 0,
            dailyWorkHours: 8,
            monthlyWorkingDays: 26,
            allowances: [],
            deductions: []
        };
    }

    let allowances = [];
    if (Array.isArray(config.allowances)) {
        allowances = config.allowances;
    } else if (typeof config.allowances === 'number' && config.allowances > 0) {
        allowances = [{ name: 'Standard Allowance', amount: config.allowances }];
    }

    let deductions = [];
    if (Array.isArray(config.deductions)) {
        deductions = config.deductions;
    } else if (typeof config.deductions === 'number' && config.deductions > 0) {
        deductions = [{ name: 'Standard Deduction', amount: config.deductions }];
    }

    return {
        basicSalary: Number(config.basicSalary) || 0,
        salaryFrequency: ['Monthly', 'Daily', 'Hourly'].includes(config.salaryFrequency) ? config.salaryFrequency : 'Monthly',
        overtimeRatePerHour: Number(config.overtimeRatePerHour) || 0,
        dailyWorkHours: Number(config.dailyWorkHours) || 8,
        monthlyWorkingDays: Number(config.monthlyWorkingDays) || 26,
        allowances,
        deductions
    };
};

// @desc    Create a new staff member
// @route   POST /api/staff
// @access  Private
export const createStaff = async (req, res) => {
    const { 
        name, email, phone, role, branchId, password,
        employeeId, joiningDate, employmentStatus, salaryConfig, bankDetails
    } = req.body;

    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'A user with this email already exists' });
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const planName = restaurant.subscription?.plan || 'Basic';
        const planDoc = await Plan.findOne({ name: planName });
        let staffLimit = 5;
        
        if (planDoc && planDoc.staffLimit !== undefined) {
            staffLimit = planDoc.staffLimit;
        } else if (['Pro', 'Professional', 'Enterprise'].includes(planName)) {
            staffLimit = Infinity;
        }

        const currentStaffCount = await User.countDocuments({
            restaurantId,
            role: { $in: ['BranchManager', 'Manager', 'Chef', 'Waiter', 'Cashier', 'DeliveryPartner', 'Staff'] }
        });

        if (currentStaffCount >= staffLimit) {
            return res.status(403).json({ 
                message: `Your current plan (${planName}) only allows up to ${staffLimit} staff users. Please upgrade your subscription plan to add more staff.`,
                limitExceeded: true
            });
        }
        
        let normalizedRole = role;
        if (normalizedRole === 'Manager') normalizedRole = 'BranchManager';
        const validRoles = ['BranchManager', 'Chef', 'Waiter', 'Cashier', 'DeliveryPartner', 'Staff'];

        if (!validRoles.includes(normalizedRole)) {
            return res.status(400).json({ message: 'Invalid staff role' });
        }

        // Auto-generate employeeId if not supplied
        const empId = employeeId ? employeeId.trim() : `EMP-${(currentStaffCount + 1).toString().padStart(4, '0')}`;
        const targetBranch = (branchId && branchId !== '' && branchId !== 'All') ? branchId : null;

        const user = await User.create({
            name,
            email,
            phoneNumber: phone,
            password: password || 'Staff@123',
            role: normalizedRole,
            restaurantId,
            branchId: targetBranch,
            employeeId: empId,
            joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
            employmentStatus: employmentStatus || 'Active',
            salaryConfig: normalizeSalaryConfig(salaryConfig),
            bankDetails: bankDetails || {}
        });

        // Sync manager to Branch
        if (user.role === 'BranchManager' && user.branchId) {
            await Branch.updateMany({ manager: user._id, _id: { $ne: user.branchId } }, { $unset: { manager: 1 } });
            await Branch.findByIdAndUpdate(user.branchId, { manager: user._id });
        }

        // If role is DeliveryPartner, create profile
        if (user.role === 'DeliveryPartner') {
            await DeliveryPartner.create({
                userId: user._id,
                restaurantId,
                verificationStatus: 'Approved',
                vehicleDetails: { type: 'Bike', model: '', rcNumber: '', licenseNumber: '' },
                documents: { profilePhoto: '', drivingLicense: '', aadhaarProof: '' }
            });
        }

        const populatedUser = await User.findById(user._id).populate('branchId', 'name').select('-password');
        res.status(201).json(populatedUser);
    } catch (error) {
        console.error('Error in createStaff:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a staff member
// @route   PUT /api/staff/:id
// @access  Private
export const updateStaff = async (req, res) => {
    const { 
        name, phone, role, branchId, password,
        employeeId, joiningDate, employmentStatus, salaryConfig, bankDetails
    } = req.body;

    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const staff = await User.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        if (restaurantId && staff.restaurantId && staff.restaurantId.toString() !== restaurantId.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this staff' });
        }

        let normalizedRole = role;
        if (normalizedRole === 'Manager') normalizedRole = 'BranchManager';
        const validRoles = ['BranchManager', 'Chef', 'Waiter', 'Cashier', 'DeliveryPartner', 'Staff'];

        if (normalizedRole && !validRoles.includes(normalizedRole)) {
            return res.status(400).json({ message: 'Invalid staff role' });
        }

        const oldRole = staff.role;
        staff.name = name || staff.name;
        if (phone !== undefined) staff.phoneNumber = phone;
        if (normalizedRole) staff.role = normalizedRole;
        if (branchId !== undefined) {
            staff.branchId = (branchId && branchId !== '' && branchId !== 'All') ? branchId : null;
        }
        if (password) staff.password = password;
        if (employeeId !== undefined) staff.employeeId = employeeId;
        if (joiningDate !== undefined) staff.joiningDate = new Date(joiningDate);
        if (employmentStatus !== undefined) staff.employmentStatus = employmentStatus;
        if (salaryConfig !== undefined) staff.salaryConfig = normalizeSalaryConfig(salaryConfig);
        if (bankDetails !== undefined) staff.bankDetails = bankDetails;

        await staff.save();

        // Sync manager to Branch
        if (staff.role === 'BranchManager' && staff.branchId) {
            await Branch.updateMany({ manager: staff._id, _id: { $ne: staff.branchId } }, { $unset: { manager: 1 } });
            await Branch.findByIdAndUpdate(staff.branchId, { manager: staff._id });
        } else if (oldRole === 'BranchManager' && staff.role !== 'BranchManager') {
            await Branch.updateMany({ manager: staff._id }, { $unset: { manager: 1 } });
        }

        // If updated to DeliveryPartner and profile does not exist, create it
        if (staff.role === 'DeliveryPartner' && oldRole !== 'DeliveryPartner') {
            const exists = await DeliveryPartner.findOne({ userId: staff._id });
            if (!exists) {
                await DeliveryPartner.create({
                    userId: staff._id,
                    restaurantId,
                    verificationStatus: 'Approved',
                    vehicleDetails: { type: 'Bike', model: '', rcNumber: '', licenseNumber: '' },
                    documents: { profilePhoto: '', drivingLicense: '', aadhaarProof: '' }
                });
            }
        }
        
        const updatedStaff = await User.findById(staff._id).populate('branchId', 'name').select('-password');
        res.json(updatedStaff);
    } catch (error) {
        console.error('Error in updateStaff:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a staff member
// @route   DELETE /api/staff/:id
// @access  Private
export const deleteStaff = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const staff = await User.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        if (staff.restaurantId?.toString() !== restaurantId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this staff' });
        }

        await Branch.updateMany({ manager: staff._id }, { $unset: { manager: 1 } });

        if (staff.role === 'DeliveryPartner') {
            await DeliveryPartner.deleteOne({ userId: staff._id });
        }

        await staff.deleteOne();
        res.json({ message: 'Staff member removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── MODULE 3: ATTENDANCE MANAGEMENT ──────────────────────────────────────────

// @desc    Mark bulk attendance for branch or staff list for a given date
// @route   POST /api/staff/attendance/bulk
// @access  Private
export const bulkMarkAttendance = async (req, res) => {
    const { date, records, branchId } = req.body;

    try {
        const restaurantId = await getUserRestaurantId(req.user);
        if (!date || !records || !records.length) {
            return res.status(400).json({ message: 'Date and attendance records are required' });
        }

        const dateObj = new Date(date);
        const dateString = dateObj.toISOString().split('T')[0];

        const results = [];
        for (const r of records) {
            const employeeId = r.employeeId || r.employee;
            if (!employeeId) continue;

            const staffMember = await User.findById(employeeId);
            if (!staffMember) continue;

            const targetBranch = staffMember.branchId || branchId || req.user.branchId;

            // Check if record exists
            let att = await Attendance.findOne({
                restaurantId,
                employee: employeeId,
                dateString
            });

            const checkInVal = r.checkIn || r.checkInTime;
            const checkOutVal = r.checkOut || r.checkOutTime;

            if (att) {
                // Update existing record
                att.status = r.status || att.status;
                if (checkInVal) att.checkIn = new Date(checkInVal);
                if (checkOutVal) att.checkOut = new Date(checkOutVal);
                if (r.lateMinutes !== undefined) att.lateMinutes = Number(r.lateMinutes);
                if (r.overtimeHours !== undefined) att.overtimeHours = Number(r.overtimeHours);
                if (r.workingHours !== undefined) att.workingHours = Number(r.workingHours);
                if (r.notes !== undefined) att.notes = r.notes;
                await att.save();
                results.push(att);
            } else {
                att = await Attendance.create({
                    restaurantId,
                    branchId: targetBranch,
                    employee: employeeId,
                    date: dateObj,
                    dateString,
                    status: r.status || 'Present',
                    checkIn: checkInVal ? new Date(checkInVal) : undefined,
                    checkOut: checkOutVal ? new Date(checkOutVal) : undefined,
                    lateMinutes: Number(r.lateMinutes) || 0,
                    overtimeHours: Number(r.overtimeHours) || 0,
                    workingHours: Number(r.workingHours) || (r.status === 'Present' ? 8 : (r.status === 'Half-day' ? 4 : 0)),
                    notes: r.notes || '',
                    createdBy: req.user._id
                });
                results.push(att);
            }
        }

        res.json({ message: `Processed ${results.length} attendance records`, records: results });
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get attendance records with date range, role, employee, and branch filters
// @route   GET /api/staff/attendance
// @access  Private
export const getAttendance = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const filter = { restaurantId };

        if (req.user.role === 'BranchManager' && req.user.branchId) {
            filter.branchId = req.user.branchId;
        } else if (req.query.branchId && req.query.branchId !== 'All') {
            filter.branchId = req.query.branchId;
        }

        if (req.query.employee && req.query.employee !== 'All') {
            filter.employee = req.query.employee;
        }

        if (req.query.status && req.query.status !== 'All') {
            filter.status = req.query.status;
        }

        if (req.query.date) {
            const dateStr = new Date(req.query.date).toISOString().split('T')[0];
            filter.dateString = dateStr;
        } else if (req.query.startDate || req.query.endDate) {
            filter.date = {};
            if (req.query.startDate) {
                const s = new Date(req.query.startDate);
                s.setHours(0, 0, 0, 0);
                filter.date.$gte = s;
            }
            if (req.query.endDate) {
                const e = new Date(req.query.endDate);
                e.setHours(23, 59, 59, 999);
                filter.date.$lte = e;
            }
        }

        const records = await Attendance.find(filter)
            .populate('employee', 'name email role employeeId phoneNumber salaryConfig')
            .populate('branchId', 'name')
            .populate('correctionHistory.correctedBy', 'name role')
            .sort({ date: -1, 'employee.name': 1 });

        // Filter by role if role query specified
        let filteredRecords = records;
        if (req.query.role && req.query.role !== 'All Roles') {
            filteredRecords = records.filter(r => r.employee?.role === req.query.role);
        }

        res.json(filteredRecords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authorize and audit an attendance correction
// @route   PUT /api/staff/attendance/:id/correct
// @access  Private
export const correctAttendance = async (req, res) => {
    const { newStatus, checkIn, checkOut, lateMinutes, overtimeHours, workingHours, reason } = req.body;

    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const att = await Attendance.findById(req.params.id);

        if (!att) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        if (att.restaurantId.toString() !== restaurantId.toString()) {
            return res.status(403).json({ message: 'Not authorized to correct this record' });
        }

        if (!reason || !reason.trim()) {
            return res.status(400).json({ message: 'Audit correction reason is mandatory' });
        }

        // Add to correction history
        att.correctionHistory.push({
            previousStatus: att.status,
            newStatus: newStatus || att.status,
            previousCheckIn: att.checkIn,
            newCheckIn: checkIn ? new Date(checkIn) : att.checkIn,
            previousCheckOut: att.checkOut,
            newCheckOut: checkOut ? new Date(checkOut) : att.checkOut,
            correctedBy: req.user._id,
            reason: reason.trim(),
            correctedAt: new Date()
        });

        att.isCorrected = true;
        if (newStatus) att.status = newStatus;
        if (checkIn) att.checkIn = new Date(checkIn);
        if (checkOut) att.checkOut = new Date(checkOut);
        if (lateMinutes !== undefined) att.lateMinutes = Number(lateMinutes);
        if (overtimeHours !== undefined) att.overtimeHours = Number(overtimeHours);
        if (workingHours !== undefined) att.workingHours = Number(workingHours);

        await att.save();

        const populated = await Attendance.findById(att._id)
            .populate('employee', 'name email role employeeId')
            .populate('correctionHistory.correctedBy', 'name role');

        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get attendance summary for a given date range
// @route   GET /api/staff/attendance/summary
// @access  Private
export const getAttendanceSummary = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const { startDate, endDate, branchId } = req.query;

        const matchFilter = { restaurantId: new mongoose.Types.ObjectId(restaurantId) };

        if (branchId && branchId !== 'All') {
            matchFilter.branchId = new mongoose.Types.ObjectId(branchId);
        } else if (req.user.role === 'BranchManager' && req.user.branchId) {
            matchFilter.branchId = new mongoose.Types.ObjectId(req.user.branchId);
        }

        if (startDate || endDate) {
            matchFilter.date = {};
            if (startDate) {
                const s = new Date(startDate);
                s.setHours(0, 0, 0, 0);
                matchFilter.date.$gte = s;
            }
            if (endDate) {
                const e = new Date(endDate);
                e.setHours(23, 59, 59, 999);
                matchFilter.date.$lte = e;
            }
        }

        const summary = await Attendance.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$employee',
                    totalRecords: { $sum: 1 },
                    presentDays: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
                    absentDays: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
                    leaveDays: { $sum: { $cond: [{ $eq: ['$status', 'Leave'] }, 1, 0] } },
                    paidLeaveDays: { 
                        $sum: { 
                            $cond: [
                                { $and: [{ $eq: ['$status', 'Leave'] }, { $ne: ['$isPaidLeave', false] }] }, 
                                1, 
                                0
                            ] 
                        } 
                    },
                    unpaidLeaveDays: { 
                        $sum: { 
                            $cond: [
                                { $and: [{ $eq: ['$status', 'Leave'] }, { $or: [{ $eq: ['$isPaidLeave', false] }, { $eq: ['$isLOP', true] }] }] }, 
                                1, 
                                0
                            ] 
                        } 
                    },
                    lopDays: {
                        $sum: {
                            $cond: [
                                { $or: [
                                    { $eq: ['$status', 'Absent'] },
                                    { $and: [{ $eq: ['$status', 'Leave'] }, { $or: [{ $eq: ['$isPaidLeave', false] }, { $eq: ['$isLOP', true] }] }] }
                                ]},
                                1,
                                0
                            ]
                        }
                    },
                    halfDays: { $sum: { $cond: [{ $eq: ['$status', 'Half-day'] }, 1, 0] } },
                    holidays: { $sum: { $cond: [{ $eq: ['$status', 'Holiday'] }, 1, 0] } },
                    totalOvertimeHours: { $sum: '$overtimeHours' },
                    totalWorkingHours: { $sum: '$workingHours' },
                    totalLateMinutes: { $sum: '$lateMinutes' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'employeeInfo'
                }
            },
            { $unwind: '$employeeInfo' },
            {
                $project: {
                    employeeId: '$_id',
                    name: '$employeeInfo.name',
                    email: '$employeeInfo.email',
                    role: '$employeeInfo.role',
                    empCode: '$employeeInfo.employeeId',
                    salaryConfig: '$employeeInfo.salaryConfig',
                    presentDays: 1,
                    absentDays: 1,
                    leaveDays: 1,
                    paidLeaveDays: 1,
                    unpaidLeaveDays: 1,
                    lopDays: 1,
                    halfDays: 1,
                    holidays: 1,
                    totalOvertimeHours: 1,
                    totalWorkingHours: 1,
                    totalLateMinutes: 1,
                    attendanceRate: {
                        $cond: [
                            { $gt: ['$totalRecords', 0] },
                            { $multiply: [{ $divide: [{ $add: ['$presentDays', { $multiply: ['$halfDays', 0.5] }] }, '$totalRecords'] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $sort: { name: 1 } }
        ]);

        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const parseMonthNumber = (val) => {
    if (!val) return null;
    if (typeof val === 'number') return (val >= 1 && val <= 12) ? val : null;
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) return parsed;
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const idx = months.indexOf(String(val).trim().toLowerCase());
    return idx !== -1 ? idx + 1 : null;
};

// Robust helper to parse allowance or deduction values from mixed types (number, string, array)
const parseConfigComponentTotal = (component) => {
    if (!component) return 0;
    if (typeof component === 'number') return isNaN(component) ? 0 : component;
    if (typeof component === 'string') {
        const n = parseFloat(component);
        return isNaN(n) ? 0 : n;
    }
    if (Array.isArray(component)) {
        return component.reduce((acc, curr) => {
            if (typeof curr === 'number') return acc + curr;
            if (typeof curr === 'string') {
                const n = parseFloat(curr);
                return acc + (isNaN(n) ? 0 : n);
            }
            if (curr && typeof curr === 'object') {
                const amt = Number(curr.amount);
                return acc + (isNaN(amt) ? 0 : amt);
            }
            return acc;
        }, 0);
    }
    return 0;
};

// Helper to attach backward-compatible flat aliases to a payroll record or plain object
const enrichPayrollWithAliases = (doc) => {
    if (!doc) return doc;
    const r = doc?.toObject ? doc.toObject() : { ...doc };
    const calc = r.calculations || {};
    return {
        ...r,
        earnedBasicSalary: calc.earnedBasic ?? r.basicSalary ?? 0,
        lopDeduction: calc.lopDeduction ?? 0,
        overtimePay: calc.overtimePay ?? 0,
        bonuses: calc.bonuses ?? 0,
        allowances: calc.allowances ?? 0,
        totalDeductions: calc.totalDeductions ?? ((calc.deductions ?? 0) + (calc.lopDeduction ?? 0)),
        grossPayable: calc.grossSalary ?? 0,
        netPayable: calc.netSalaryPayable ?? 0,
    };
};

const calculateEmployeePayrollItem = async (emp, m, y, restaurantId) => {
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59, 999);
    const daysInMonth = new Date(y, m, 0).getDate();

    // Fetch Restaurant LOP and Leave Policy
    const restaurant = await Restaurant.findById(restaurantId).select('restaurantConfig');
    const payrollConfig = restaurant?.restaurantConfig?.payrollConfig || {};
    const lopPolicy = payrollConfig.lopCalculationPolicy || 'Configured_Working_Days';

    const config = emp.salaryConfig || {};
    const basic = Number(config.basicSalary) || 0;
    const freq = config.salaryFrequency || 'Monthly';
    const otRate = Number(config.overtimeRatePerHour) || 0;
    const standardWorkDays = Number(config.monthlyWorkingDays) || 26;
    const dailyHours = Number(config.dailyWorkHours) || 8;

    // Fetch attendance records for this employee in this month
    const attendance = await Attendance.find({
        restaurantId,
        employee: emp._id,
        date: { $gte: startDate, $lte: endDate }
    });

    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;
    let halfDays = 0;
    let holidays = 0;
    let overtimeHours = 0;
    let totalWorkingHours = 0;

    for (const a of attendance) {
        if (a.status === 'Present') presentDays++;
        else if (a.status === 'Absent') absentDays++;
        else if (a.status === 'Leave') {
            leaveDays++;
            if (a.isPaidLeave === false || a.isLOP === true) {
                unpaidLeaveDays++;
            } else {
                paidLeaveDays++;
            }
        }
        else if (a.status === 'Half-day') halfDays++;
        else if (a.status === 'Holiday') holidays++;

        overtimeHours += (a.overtimeHours || 0);
        totalWorkingHours += (a.workingHours || 0);
    }

    // Determine working days divisor based on restaurant's configured LOP policy
    let divisorDays = standardWorkDays;
    if (lopPolicy === 'Calendar_Days') {
        divisorDays = daysInMonth;
    } else if (lopPolicy === 'Standard_26_Days') {
        divisorDays = 26;
    } else {
        divisorDays = standardWorkDays > 0 ? standardWorkDays : 26;
    }

    const perDayRate = divisorDays > 0 ? (basic / divisorDays) : 0;
    const lopDays = unpaidLeaveDays + absentDays;
    const lopDeduction = Math.round(lopDays * perDayRate * 100) / 100;

    let calculatedOtRate = otRate;
    if (calculatedOtRate === 0 && perDayRate > 0) {
        calculatedOtRate = Math.round((perDayRate / dailyHours) * 1.5 * 100) / 100;
    }

    // Calculations based on salary frequency
    let earnedBasic = 0;
    if (freq === 'Monthly') {
        // If employee has 0 attendance records, assume regular full month
        if (attendance.length === 0) {
            earnedBasic = basic;
        } else {
            earnedBasic = Math.max(0, Math.round((basic - lopDeduction) * 100) / 100);
        }
    } else if (freq === 'Daily') {
        earnedBasic = Math.round(basic * (presentDays + (halfDays * 0.5) + paidLeaveDays) * 100) / 100;
    } else if (freq === 'Hourly') {
        calculatedOtRate = otRate || (basic * 1.5);
        earnedBasic = Math.round(basic * totalWorkingHours * 100) / 100;
    }

    const overtimePay = Math.round(overtimeHours * calculatedOtRate * 100) / 100;

    // Allowances & Deductions safely parsed from config
    const allowancesTotal = Math.round(parseConfigComponentTotal(config.allowances) * 100) / 100;
    const otherDeductionsTotal = Math.round(parseConfigComponentTotal(config.deductions) * 100) / 100;
    const totalDeductions = Math.round((otherDeductionsTotal + lopDeduction) * 100) / 100;

    const grossSalary = Math.round((earnedBasic + overtimePay + allowancesTotal) * 100) / 100;
    const netSalary = Math.max(0, Math.round((grossSalary - otherDeductionsTotal) * 100) / 100);

    return {
        employee: {
            _id: emp._id,
            name: emp.name,
            email: emp.email,
            role: emp.role,
            employeeId: emp.employeeId,
            branch: emp.branchId
        },
        month: m,
        year: y,
        periodString: `${y}-${m.toString().padStart(2, '0')}`,
        payPeriod: { startDate, endDate },
        salaryFrequency: freq,
        basicSalary: basic,
        earnedBasicSalary: earnedBasic,
        lopDeduction,
        overtimePay,
        bonuses: 0,
        allowances: allowancesTotal,
        otherDeductions: otherDeductionsTotal,
        totalDeductions,
        grossPayable: grossSalary,
        netPayable: netSalary,
        attendanceSummary: {
            presentDays,
            absentDays,
            leaveDays,
            paidLeaveDays,
            unpaidLeaveDays,
            lopDays,
            halfDays,
            holidays,
            overtimeHours,
            totalWorkingDays: divisorDays
        },
        calculations: {
            earnedBasic,
            lopDeduction,
            overtimePay,
            bonuses: 0,
            allowances: allowancesTotal,
            grossSalary,
            deductions: otherDeductionsTotal,
            totalDeductions,
            advances: 0,
            netSalaryPayable: netSalary
        },
        paidAmount: 0,
        balanceDue: netSalary,
        paymentStatus: 'Pending',
        status: 'Generated'
    };
};

// ─── MODULE 4: SALARY AND PAYROLL MANAGEMENT ─────────────────────────────────

// @desc    Calculate and preview payroll for a month/year based on attendance
// @route   POST /api/staff/payroll/calculate
// @access  Private
export const calculatePayroll = async (req, res) => {
    const { month, year, branchId } = req.body;

    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const m = parseMonthNumber(month);
        const y = parseInt(year);

        if (!m || !y || m < 1 || m > 12) {
            return res.status(400).json({ message: 'Valid month and year are required' });
        }

        const staffFilter = {
            restaurantId,
            role: { $in: ['BranchManager', 'Chef', 'Waiter', 'Cashier', 'DeliveryPartner'] },
            employmentStatus: { $ne: 'Terminated' }
        };

        if (branchId && branchId !== 'All') {
            staffFilter.branchId = branchId;
        } else if (req.user.role === 'BranchManager' && req.user.branchId) {
            staffFilter.branchId = req.user.branchId;
        }

        const employees = await User.find(staffFilter).populate('branchId', 'name');
        const calculatedPayroll = [];

        for (const emp of employees) {
            const item = await calculateEmployeePayrollItem(emp, m, y, restaurantId);
            calculatedPayroll.push(item);
        }

        res.json({
            month: m,
            year: y,
            count: calculatedPayroll.length,
            totalEmployees: calculatedPayroll.length,
            totalGrossPayable: calculatedPayroll.reduce((acc, c) => acc + c.calculations.grossSalary, 0),
            totalNetPayable: calculatedPayroll.reduce((acc, c) => acc + c.calculations.netSalaryPayable, 0),
            payroll: calculatedPayroll
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate / Save Payroll records for a month
// @route   POST /api/staff/payroll/generate
// @access  Private
export const generatePayroll = async (req, res) => {
    const { month, year, branchId, payrollData } = req.body;

    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const m = parseMonthNumber(month);
        const y = parseInt(year);

        if (!m || !y) {
            return res.status(400).json({ message: 'Valid month and year are required' });
        }

        let itemsToProcess = payrollData;
        if (!itemsToProcess || !itemsToProcess.length) {
            // Auto-calculate for all active staff
            const staffFilter = {
                restaurantId,
                role: { $in: ['BranchManager', 'Chef', 'Waiter', 'Cashier', 'DeliveryPartner'] },
                employmentStatus: { $ne: 'Terminated' }
            };

            if (branchId && branchId !== 'All') {
                staffFilter.branchId = branchId;
            } else if (req.user.role === 'BranchManager' && req.user.branchId) {
                staffFilter.branchId = req.user.branchId;
            }

            const employees = await User.find(staffFilter).populate('branchId', 'name');
            itemsToProcess = [];
            for (const emp of employees) {
                const item = await calculateEmployeePayrollItem(emp, m, y, restaurantId);
                itemsToProcess.push(item);
            }
        }

        const periodString = `${y}-${m.toString().padStart(2, '0')}`;
        const savedRecords = [];

        for (const item of itemsToProcess) {
            const empId = item.employee?._id || item.employee;

            // Check if payroll already exists for this employee/period
            let pr = await Payroll.findOne({
                restaurantId,
                employee: empId,
                month: m,
                year: y
            });

            if (pr) {
                // Update existing record
                pr.attendanceSummary = item.attendanceSummary;
                pr.calculations = item.calculations;
                pr.balanceDue = Math.max(0, item.calculations.netSalaryPayable - pr.paidAmount);
                pr.paymentStatus = pr.paidAmount >= item.calculations.netSalaryPayable ? 'Paid' : (pr.paidAmount > 0 ? 'Partially Paid' : 'Pending');
                pr.status = 'Approved';
                pr.approvedBy = req.user._id;
                pr.approvedAt = new Date();
                await pr.save();
                savedRecords.push(pr);
            } else {
                pr = await Payroll.create({
                    restaurantId,
                    branchId: item.employee?.branch?._id || branchId || req.user.branchId,
                    employee: empId,
                    month: m,
                    year: y,
                    periodString,
                    payPeriod: item.payPeriod,
                    salaryFrequency: item.salaryFrequency,
                    basicSalary: item.basicSalary,
                    attendanceSummary: item.attendanceSummary,
                    calculations: item.calculations,
                    paidAmount: 0,
                    balanceDue: item.calculations.netSalaryPayable,
                    paymentStatus: 'Pending',
                    status: 'Approved',
                    approvedBy: req.user._id,
                    approvedAt: new Date()
                });
                savedRecords.push(pr);
            }
        }

        res.status(201).json({
            message: `Successfully processed ${savedRecords.length} payroll records for ${periodString}`,
            count: savedRecords.length,
            records: savedRecords.map(enrichPayrollWithAliases)
        });
    } catch (error) {
        console.error('Error generating payroll:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get payroll records with month, year, branch, and status filters
// @route   GET /api/staff/payroll
// @access  Private
export const getPayrollRecords = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const filter = { restaurantId };

        if (req.user.role === 'BranchManager' && req.user.branchId) {
            filter.branchId = req.user.branchId;
        } else if (req.query.branchId && req.query.branchId !== 'All') {
            filter.branchId = req.query.branchId;
        }

        if (req.query.month && req.query.month !== 'All') {
            const m = parseMonthNumber(req.query.month);
            if (m) filter.month = m;
        }

        if (req.query.year && req.query.year !== 'All') {
            filter.year = parseInt(req.query.year);
        }

        if (req.query.employee && req.query.employee !== 'All') {
            filter.employee = req.query.employee;
        }

        if (req.query.paymentStatus && req.query.paymentStatus !== 'All') {
            filter.paymentStatus = req.query.paymentStatus;
        }

        const records = await Payroll.find(filter)
            .populate('employee', 'name email role employeeId phoneNumber bankDetails')
            .populate('branchId', 'name')
            .populate('approvedBy', 'name role')
            .populate('payments.paidBy', 'name')
            .sort({ year: -1, month: -1, 'employee.name': 1 });

        res.json(records.map(enrichPayrollWithAliases));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single payroll record (for salary slip modal/printing)
// @route   GET /api/staff/payroll/:id
// @access  Private
export const getPayrollById = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const record = await Payroll.findById(req.params.id)
            .populate('employee', 'name email role employeeId phoneNumber bankDetails joiningDate salaryConfig')
            .populate('branchId', 'name address phone')
            .populate('restaurantId', 'name address phone logo currency')
            .populate('approvedBy', 'name role')
            .populate('payments.paidBy', 'name role');

        if (!record) {
            return res.status(404).json({ message: 'Payroll record not found' });
        }

        if (record.restaurantId._id.toString() !== restaurantId.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this record' });
        }

        res.json(enrichPayrollWithAliases(record));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Record partial or full salary payment & link to Expense
// @route   POST /api/staff/payroll/:id/pay
// @access  Private
export const recordPayrollPayment = async (req, res) => {
    const { amount, paymentMethod, reference, notes, paymentDate } = req.body;

    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const payroll = await Payroll.findById(req.params.id).populate('employee', 'name email employeeId');

        if (!payroll) {
            return res.status(404).json({ message: 'Payroll record not found' });
        }

        if (payroll.restaurantId.toString() !== restaurantId.toString()) {
            return res.status(403).json({ message: 'Not authorized to modify this record' });
        }

        const payAmount = Number(amount);
        if (!payAmount || payAmount <= 0) {
            return res.status(400).json({ message: 'Valid payment amount is required' });
        }

        const netPayable = payroll.calculations.netSalaryPayable;
        const newPaid = Math.min(netPayable, (payroll.paidAmount || 0) + payAmount);
        const newBalance = Math.max(0, netPayable - newPaid);
        const newPaymentStatus = newPaid >= netPayable ? 'Paid' : (newPaid > 0 ? 'Partially Paid' : 'Pending');

        const payDate = paymentDate ? new Date(paymentDate) : new Date();

        payroll.paidAmount = newPaid;
        payroll.balanceDue = newBalance;
        payroll.paymentStatus = newPaymentStatus;
        payroll.payments.push({
            amount: payAmount,
            paymentDate: payDate,
            paymentMethod: paymentMethod || 'Bank Transfer',
            reference: reference || '',
            notes: notes || '',
            paidBy: req.user._id
        });

        // Record payment in audit history
        if (!payroll.auditHistory) payroll.auditHistory = [];
        payroll.auditHistory.push({
            action: 'Payment Recorded',
            performedBy: req.user._id,
            performedByName: req.user.name || 'Admin',
            timestamp: payDate,
            notes: `Disbursed ₹${payAmount} via ${paymentMethod || 'Bank Transfer'} (Ref: ${reference || 'N/A'})`,
            changes: { amount: payAmount, paymentMethod, reference }
        });

        await payroll.save();

        // Connect to Expenses Management WITHOUT DOUBLE-COUNTING:
        await Expense.create({
            title: `Salary Payment - ${payroll.employee?.name || 'Staff'} (${payroll.periodString})`,
            category: 'Staff salary',
            amount: payAmount,
            paidAmount: payAmount,
            balanceDue: 0,
            paymentStatus: 'Paid',
            paymentMethod: paymentMethod || 'Bank Transfer',
            paymentDate: payDate,
            description: `Salary Payment for ${payroll.employee?.name || 'Staff'} (${payroll.periodString}) - Ref: ${reference || 'N/A'}`,
            date: payDate,
            billingPeriod: payroll.periodString,
            staff: req.user.name || 'Admin',
            restaurantId,
            branchId: payroll.branchId,
            source: 'Payroll',
            sourceId: payroll._id,
            createdBy: req.user._id,
            notes: notes || `Payroll salary disbursed for ${payroll.periodString}`
        });

        res.json({
            message: 'Salary payment recorded successfully',
            payroll: enrichPayrollWithAliases(payroll)
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get salary history for an employee
// @route   GET /api/staff/payroll/employee/:id/history
// @access  Private
export const getEmployeeSalaryHistory = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const records = await Payroll.find({
            restaurantId,
            employee: req.params.id
        }).sort({ year: -1, month: -1 });

        res.json(records.map(enrichPayrollWithAliases));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── LEAVE MANAGEMENT APIS ──────────────────────────────────────────────────

// @desc    Staff applies for leave
// @route   POST /api/staff/leave
// @access  Private (Staff, Waiter, Chef, Cashier, Manager, Admin)
export const applyLeave = async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;
        if (!startDate || !endDate || !reason) {
            return res.status(400).json({ message: 'Start date, end date, and reason are required' });
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid start or end date' });
        }

        if (start > end) {
            return res.status(400).json({ message: 'End date must be on or after start date' });
        }

        const restaurantId = await getUserRestaurantId(req.user);
        const userDoc = await User.findById(req.user._id);
        const branchId = userDoc?.branchId || req.user.branchId;

        if (!branchId) {
            return res.status(400).json({ message: 'No branch assigned to your staff profile' });
        }

        // Prevent duplicate or overlapping leave requests for the same employee
        const overlappingLeave = await Leave.findOne({
            restaurantId,
            employee: req.user._id,
            status: { $in: ['Pending', 'Approved'] },
            startDate: { $lte: end },
            endDate: { $gte: start }
        });

        if (overlappingLeave) {
            return res.status(400).json({ 
                message: `You already have an active (${overlappingLeave.status}) leave request overlapping these dates (${new Date(overlappingLeave.startDate).toLocaleDateString()} to ${new Date(overlappingLeave.endDate).toLocaleDateString()})` 
            });
        }

        // Calculate days count
        const diffMs = end.getTime() - start.getTime();
        const daysCount = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

        // Determine if paid according to policy
        let isPaid = true;
        if (leaveType === 'Unpaid Leave') {
            isPaid = false;
        } else {
            const restaurant = await Restaurant.findById(restaurantId).select('restaurantConfig');
            const quota = restaurant?.restaurantConfig?.payrollConfig?.monthlyPaidLeaveQuota ?? 2;
            const startMonth = start.getMonth() + 1;
            const startYear = start.getFullYear();
            const monthStart = new Date(startYear, startMonth - 1, 1);
            const monthEnd = new Date(startYear, startMonth, 0, 23, 59, 59, 999);

            const existingPaidLeaves = await Leave.find({
                restaurantId,
                employee: req.user._id,
                status: 'Approved',
                isPaid: true,
                startDate: { $gte: monthStart, $lte: monthEnd }
            });
            const usedPaidDays = existingPaidLeaves.reduce((acc, l) => acc + (l.daysCount || 0), 0);
            if (usedPaidDays + daysCount > quota && quota > 0) {
                isPaid = false;
            }
        }

        const leave = await Leave.create({
            restaurantId,
            branchId,
            employee: req.user._id,
            leaveType: leaveType || 'Casual Leave',
            isPaid,
            startDate: start,
            endDate: end,
            daysCount,
            reason: reason.trim(),
            status: 'Pending',
            appliedAt: new Date()
        });

        const populatedLeave = await Leave.findById(leave._id)
            .populate('branchId', 'name')
            .populate('employee', 'name email role employeeId');

        res.status(201).json({
            message: 'Leave request submitted successfully',
            leave: populatedLeave
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged-in staff member's leave request history
// @route   GET /api/staff/leave/my
// @access  Private (Staff)
export const getMyLeaves = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const leaves = await Leave.find({
            restaurantId,
            employee: req.user._id
        })
        .populate('branchId', 'name')
        .populate('approvedBy', 'name role')
        .sort({ createdAt: -1 });

        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Staff cancels a pending leave request
// @route   PUT /api/staff/leave/:id/cancel
// @access  Private (Staff)
export const cancelMyLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ message: 'Leave request not found' });

        if (leave.employee.toString() !== req.user._id.toString() && req.user.role !== 'RestaurantAdmin' && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({ message: 'Not authorized to cancel this leave request' });
        }

        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot cancel a leave request that is already ${leave.status}` });
        }

        leave.status = 'Cancelled';
        leave.cancelledAt = new Date();
        leave.cancellationReason = req.body?.reason || 'Cancelled by employee';
        await leave.save();

        res.json({ message: 'Leave request cancelled successfully', leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get leave requests for branch manager or admin
// @route   GET /api/staff/leave
// @access  Private (BranchManager, RestaurantAdmin)
export const getLeaveRequests = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const filter = { restaurantId };

        if (req.user.role === 'BranchManager' && req.user.branchId) {
            filter.branchId = req.user.branchId;
        } else if (req.query.branchId && req.query.branchId !== 'All') {
            filter.branchId = req.query.branchId;
        }

        if (req.query.status && req.query.status !== 'All') {
            filter.status = req.query.status;
        }

        if (req.query.leaveType && req.query.leaveType !== 'All') {
            filter.leaveType = req.query.leaveType;
        }

        if (req.query.employeeId) {
            filter.employee = req.query.employeeId;
        }

        const leaves = await Leave.find(filter)
            .populate('employee', 'name email role employeeId phoneNumber salaryConfig')
            .populate('branchId', 'name')
            .populate('approvedBy', 'name role')
            .sort({ status: 1, createdAt: -1 });

        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve or reject a leave request
// @route   PUT /api/staff/leave/:id/status
// @access  Private (BranchManager, RestaurantAdmin)
export const updateLeaveStatus = async (req, res) => {
    try {
        const { status, managerRemarks, isPaid } = req.body;
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be either Approved or Rejected' });
        }

        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ message: 'Leave request not found' });

        if (req.user.role === 'BranchManager' && req.user.branchId) {
            if (leave.branchId.toString() !== req.user.branchId.toString()) {
                return res.status(403).json({ message: 'Unauthorized: You can only approve leaves for your assigned branch' });
            }
        }

        leave.status = status;
        leave.approvedBy = req.user._id;
        leave.approvalDate = new Date();
        leave.managerRemarks = managerRemarks || '';
        if (isPaid !== undefined) {
            leave.isPaid = Boolean(isPaid);
        }
        await leave.save();

        // When Approved: Synchronize into Attendance records
        if (status === 'Approved') {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            let curr = new Date(start);

            while (curr <= end) {
                const dateString = curr.toISOString().split('T')[0];
                const dayDate = new Date(curr);

                await Attendance.findOneAndUpdate(
                    {
                        restaurantId: leave.restaurantId,
                        employee: leave.employee,
                        dateString
                    },
                    {
                        $set: {
                            restaurantId: leave.restaurantId,
                            branchId: leave.branchId,
                            employee: leave.employee,
                            date: dayDate,
                            dateString,
                            status: 'Leave',
                            leaveId: leave._id,
                            leaveType: leave.leaveType,
                            isPaidLeave: leave.isPaid,
                            isLOP: !leave.isPaid,
                            notes: `Approved Leave: ${leave.leaveType} (${leave.isPaid ? 'Paid' : 'Unpaid/LOP'})${managerRemarks ? ' - ' + managerRemarks : ''}`
                        }
                    },
                    { upsert: true, new: true }
                );

                curr.setDate(curr.getDate() + 1);
            }
        } else if (status === 'Rejected') {
            await Attendance.deleteMany({
                restaurantId: leave.restaurantId,
                employee: leave.employee,
                leaveId: leave._id
            });
        }

        const updatedLeave = await Leave.findById(leave._id)
            .populate('employee', 'name email role employeeId')
            .populate('branchId', 'name')
            .populate('approvedBy', 'name role');

        res.json({
            message: `Leave request ${status.toLowerCase()} successfully`,
            leave: updatedLeave
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── STAFF MY PAYROLL APIS ──────────────────────────────────────────────────

// @desc    Get logged-in staff member's payroll records
// @route   GET /api/staff/payroll/my
// @access  Private (Staff: Waiter, Chef, Cashier, etc.)
export const getMyPayroll = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const records = await Payroll.find({
            restaurantId,
            employee: req.user._id
        })
        .populate('branchId', 'name address phone')
        .sort({ year: -1, month: -1 });

        res.json(records.map(enrichPayrollWithAliases));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get printable salary slip for logged-in staff member
// @route   GET /api/staff/payroll/my/:id/slip
// @access  Private (Staff)
export const getMyPayrollSlip = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const payroll = await Payroll.findOne({
            _id: req.params.id,
            restaurantId,
            employee: req.user._id
        })
        .populate('employee', 'name email role employeeId phoneNumber bankDetails salaryConfig')
        .populate('branchId', 'name address phone')
        .populate('approvedBy', 'name role');

        if (!payroll) {
            return res.status(404).json({ message: 'Salary slip not found or not authorized' });
        }

        const restaurant = await Restaurant.findById(restaurantId)
            .select('name address phone logo gstin email');

        res.json({
            payroll: enrichPayrollWithAliases(payroll),
            restaurant
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── PAYROLL CORRECTIONS, REPORTS & CONFIG APIS ─────────────────────────────

// @desc    Correct payroll calculation components before or after final generation
// @route   PUT /api/staff/payroll/:id/correct
// @access  Private (RestaurantAdmin, BranchManager)
export const correctPayrollRecord = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const payroll = await Payroll.findOne({ _id: req.params.id, restaurantId })
            .populate('employee', 'name employeeId role');

        if (!payroll) return res.status(404).json({ message: 'Payroll record not found' });

        if (req.user.role === 'BranchManager' && req.user.branchId) {
            if (payroll.branchId && payroll.branchId.toString() !== req.user.branchId.toString()) {
                return res.status(403).json({ message: 'Unauthorized: You cannot modify payroll for another branch' });
            }
        }

        if (payroll.paymentStatus === 'Paid' && req.user.role !== 'SuperAdmin' && req.user.role !== 'RestaurantAdmin') {
            return res.status(400).json({ message: 'Cannot modify a finalized and fully paid payroll record' });
        }

        const { basicSalary, allowances, overtimePay, bonuses, deductions, advances, notes } = req.body;

        const previousCalculations = { ...(payroll.calculations?.toObject ? payroll.calculations.toObject() : payroll.calculations) };

        if (!payroll.calculations) payroll.calculations = {};
        if (basicSalary !== undefined) payroll.basicSalary = Number(basicSalary);
        if (allowances !== undefined) payroll.calculations.allowances = Number(allowances);
        if (overtimePay !== undefined) payroll.calculations.overtimePay = Number(overtimePay);
        if (bonuses !== undefined) payroll.calculations.bonuses = Number(bonuses);
        if (deductions !== undefined) payroll.calculations.deductions = Number(deductions);
        if (advances !== undefined) payroll.calculations.advances = Number(advances);

        const earned = payroll.calculations.earnedBasic || payroll.basicSalary;
        const gross = Math.round((earned + (payroll.calculations.overtimePay || 0) + (payroll.calculations.bonuses || 0) + (payroll.calculations.allowances || 0)) * 100) / 100;
        const totalDed = Math.round(((payroll.calculations.deductions || 0) + (payroll.calculations.lopDeduction || 0) + (payroll.calculations.advances || 0)) * 100) / 100;
        const net = Math.max(0, Math.round((gross - (payroll.calculations.deductions || 0) - (payroll.calculations.advances || 0)) * 100) / 100);

        payroll.calculations.grossSalary = gross;
        payroll.calculations.totalDeductions = totalDed;
        payroll.calculations.netSalaryPayable = net;
        payroll.balanceDue = Math.max(0, net - (payroll.paidAmount || 0));
        payroll.paymentStatus = (payroll.paidAmount || 0) >= net ? 'Paid' : ((payroll.paidAmount || 0) > 0 ? 'Partially Paid' : 'Pending');

        if (!payroll.auditHistory) payroll.auditHistory = [];
        payroll.auditHistory.push({
            action: 'Payroll Correction',
            performedBy: req.user._id,
            performedByName: req.user.name || 'Admin',
            timestamp: new Date(),
            notes: notes || 'Manual adjustment of payroll components',
            changes: {
                previous: previousCalculations,
                updated: payroll.calculations
            }
        });

        await payroll.save();

        res.json({
            message: 'Payroll record corrected successfully',
            payroll: enrichPayrollWithAliases(payroll)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get aggregated payroll reports and summaries
// @route   GET /api/staff/payroll/reports
// @access  Private (RestaurantAdmin, BranchManager)
export const getPayrollReports = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const { year, month, branchId, status } = req.query;

        const filter = { restaurantId };
        if (year) filter.year = Number(year);
        if (month) filter.month = parseMonthNumber(month) || Number(month);
        if (branchId && branchId !== 'All') filter.branchId = branchId;
        else if (req.user.role === 'BranchManager' && req.user.branchId) filter.branchId = req.user.branchId;
        if (status && status !== 'All') filter.paymentStatus = status;

        const records = await Payroll.find(filter)
            .populate('employee', 'name email role employeeId')
            .populate('branchId', 'name')
            .sort({ year: -1, month: -1 });

        const totalGross = records.reduce((sum, r) => sum + (r.calculations?.grossSalary || 0), 0);
        const totalNet = records.reduce((sum, r) => sum + (r.calculations?.netSalaryPayable || 0), 0);
        const totalPaid = records.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
        const totalDue = records.reduce((sum, r) => sum + (r.balanceDue || 0), 0);
        const totalLOP = records.reduce((sum, r) => sum + (r.calculations?.lopDeduction || 0), 0);
        const paidCount = records.filter(r => r.paymentStatus === 'Paid').length;
        const pendingCount = records.filter(r => r.paymentStatus !== 'Paid').length;

        const branchBreakdown = {};
        for (const r of records) {
            const bName = r.branchId?.name || 'Main Branch';
            if (!branchBreakdown[bName]) {
                branchBreakdown[bName] = { branchName: bName, totalEmployees: 0, gross: 0, net: 0, paid: 0, due: 0 };
            }
            branchBreakdown[bName].totalEmployees++;
            branchBreakdown[bName].gross += (r.calculations?.grossSalary || 0);
            branchBreakdown[bName].net += (r.calculations?.netSalaryPayable || 0);
            branchBreakdown[bName].paid += (r.paidAmount || 0);
            branchBreakdown[bName].due += (r.balanceDue || 0);
        }

        res.json({
            count: records.length,
            totalGrossPayable: Math.round(totalGross * 100) / 100,
            totalNetPayable: Math.round(totalNet * 100) / 100,
            totalPaid: Math.round(totalPaid * 100) / 100,
            totalDue: Math.round(totalDue * 100) / 100,
            totalLOPDeductions: Math.round(totalLOP * 100) / 100,
            paidCount,
            pendingCount,
            branchBreakdown: Object.values(branchBreakdown),
            records: records.map(enrichPayrollWithAliases)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get restaurant payroll and LOP configuration
// @route   GET /api/staff/payroll/config
// @access  Private (RestaurantAdmin, BranchManager)
export const getPayrollConfig = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const restaurant = await Restaurant.findById(restaurantId).select('restaurantConfig.payrollConfig');
        const config = restaurant?.restaurantConfig?.payrollConfig || {
            lopCalculationPolicy: 'Configured_Working_Days',
            monthlyPaidLeaveQuota: 2,
            unpaidLeaveDeductionType: 'Full_Day_Basic'
        };
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update restaurant payroll and LOP configuration
// @route   PUT /api/staff/payroll/config
// @access  Private (RestaurantAdmin)
export const updatePayrollConfig = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const { lopCalculationPolicy, monthlyPaidLeaveQuota, unpaidLeaveDeductionType } = req.body;

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

        if (!restaurant.restaurantConfig) restaurant.restaurantConfig = {};
        if (!restaurant.restaurantConfig.payrollConfig) restaurant.restaurantConfig.payrollConfig = {};

        if (lopCalculationPolicy) {
            restaurant.restaurantConfig.payrollConfig.lopCalculationPolicy = lopCalculationPolicy;
        }
        if (monthlyPaidLeaveQuota !== undefined) {
            restaurant.restaurantConfig.payrollConfig.monthlyPaidLeaveQuota = Number(monthlyPaidLeaveQuota);
        }
        if (unpaidLeaveDeductionType) {
            restaurant.restaurantConfig.payrollConfig.unpaidLeaveDeductionType = unpaidLeaveDeductionType;
        }

        await restaurant.save();

        res.json({
            message: 'Payroll configuration updated successfully',
            config: restaurant.restaurantConfig.payrollConfig
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

