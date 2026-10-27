import mongoose from 'mongoose';
import User from '../models/User.js';
import Branch from '../models/Branch.js';
import Restaurant from '../models/Restaurant.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Plan from '../models/Plan.js';
import Attendance from '../models/Attendance.js';
import Payroll from '../models/Payroll.js';
import Expense from '../models/Expense.js';

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
        overtimePay: calc.overtimePay ?? 0,
        bonuses: calc.bonuses ?? 0,
        allowances: calc.allowances ?? 0,
        totalDeductions: calc.deductions ?? 0,
        grossPayable: calc.grossSalary ?? 0,
        netPayable: calc.netSalaryPayable ?? 0,
    };
};

const calculateEmployeePayrollItem = async (emp, m, y, restaurantId) => {
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59, 999);
    const daysInMonth = new Date(y, m, 0).getDate();

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
    let halfDays = 0;
    let holidays = 0;
    let overtimeHours = 0;
    let totalWorkingHours = 0;

    for (const a of attendance) {
        if (a.status === 'Present') presentDays++;
        else if (a.status === 'Absent') absentDays++;
        else if (a.status === 'Leave') leaveDays++;
        else if (a.status === 'Half-day') halfDays++;
        else if (a.status === 'Holiday') holidays++;

        overtimeHours += (a.overtimeHours || 0);
        totalWorkingHours += (a.workingHours || 0);
    }

    // Calculations based on frequency
    let earnedBasic = 0;
    let calculatedOtRate = otRate;

    if (freq === 'Monthly') {
        const perDayRate = standardWorkDays > 0 ? (basic / standardWorkDays) : (basic / daysInMonth);
        if (calculatedOtRate === 0 && perDayRate > 0) {
            calculatedOtRate = Math.round((perDayRate / dailyHours) * 1.5 * 100) / 100;
        }
        // If employee has 0 attendance records, still give full basic salary for monthly employees if no absent records
        const paidDayUnits = attendance.length === 0 ? standardWorkDays : (presentDays + (halfDays * 0.5) + holidays);
        earnedBasic = Math.min(basic, Math.round(perDayRate * paidDayUnits * 100) / 100);
    } else if (freq === 'Daily') {
        if (calculatedOtRate === 0 && basic > 0) {
            calculatedOtRate = Math.round((basic / dailyHours) * 1.5 * 100) / 100;
        }
        earnedBasic = Math.round(basic * (presentDays + (halfDays * 0.5)) * 100) / 100;
    } else if (freq === 'Hourly') {
        calculatedOtRate = otRate || (basic * 1.5);
        earnedBasic = Math.round(basic * totalWorkingHours * 100) / 100;
    }

    const overtimePay = Math.round(overtimeHours * calculatedOtRate * 100) / 100;

    // Allowances & Deductions safely parsed from config
    const allowancesTotal = Math.round(parseConfigComponentTotal(config.allowances) * 100) / 100;
    const deductionsTotal = Math.round(parseConfigComponentTotal(config.deductions) * 100) / 100;

    const grossSalary = Math.round((earnedBasic + overtimePay + allowancesTotal) * 100) / 100;
    const netSalary = Math.max(0, Math.round((grossSalary - deductionsTotal) * 100) / 100);

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
        overtimePay,
        bonuses: 0,
        allowances: allowancesTotal,
        totalDeductions: deductionsTotal,
        grossPayable: grossSalary,
        netPayable: netSalary,
        attendanceSummary: {
            presentDays,
            absentDays,
            leaveDays,
            halfDays,
            holidays,
            overtimeHours,
            totalWorkingDays: standardWorkDays
        },
        calculations: {
            earnedBasic,
            overtimePay,
            bonuses: 0,
            allowances: allowancesTotal,
            grossSalary,
            deductions: deductionsTotal,
            advances: 0,
            netSalaryPayable: netSalary
        },
        paidAmount: 0,
        balanceDue: netSalary,
        paymentStatus: 'Pending',
        status: 'Draft'
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

        await payroll.save();

        // Connect to Expenses Management WITHOUT DOUBLE-COUNTING:
        // Create an Expense record for the paid amount, tagged with source: 'Payroll' and sourceId: payroll._id.
        // It records the paid amount directly into cash-flow and profit & loss!
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

        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
