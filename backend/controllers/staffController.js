import User from '../models/User.js';
import Branch from '../models/Branch.js';
import Restaurant from '../models/Restaurant.js';
import DeliveryPartner from '../models/DeliveryPartner.js';

// @desc    Update a staff member
// @route   PUT /api/staff/:id
// @access  Private
export const updateStaff = async (req, res) => {
    const { name, phone, role, branchId, password } = req.body;

    try {
        const staff = await User.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        if (staff.restaurantId?.toString() !== req.user.restaurantId.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this staff' });
        }

        const restaurant = await Restaurant.findById(req.user.restaurantId);
        const hasEnterprise = restaurant && (restaurant.plan === 'Enterprise' || restaurant.plan?.toLowerCase() === 'enterprise');

        const validRoles = hasEnterprise
            ? ['BranchManager', 'Chef', 'Waiter', 'Cashier', 'DeliveryPartner']
            : ['BranchManager', 'Chef', 'Waiter', 'Cashier'];

        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid staff role' });
        }

        const oldRole = staff.role;
        staff.name = name || staff.name;
        if (phone !== undefined) {
            staff.phoneNumber = phone;
        }
        staff.role = role || staff.role;
        if (branchId !== undefined) {
            staff.branchId = branchId === '' ? null : branchId;
        }
        
        if (password) {
            staff.password = password;
        }

        await staff.save();

        // Sync manager to Branch
        if (staff.role === 'BranchManager' && staff.branchId) {
            // Clear this user from being manager of any other branch
            await Branch.updateMany({ manager: staff._id, _id: { $ne: staff.branchId } }, { $unset: { manager: 1 } });
            // Set this user as manager of the new branch
            await Branch.findByIdAndUpdate(staff.branchId, { manager: staff._id });
        } else {
            // If they are no longer BranchManager, clear them from all branches
            await Branch.updateMany({ manager: staff._id }, { $unset: { manager: 1 } });
        }

        // If updated to DeliveryPartner and profile does not exist, create it
        if (staff.role === 'DeliveryPartner' && oldRole !== 'DeliveryPartner') {
            const exists = await DeliveryPartner.findOne({ userId: staff._id });
            if (!exists) {
                await DeliveryPartner.create({
                    userId: staff._id,
                    restaurantId: req.user.restaurantId,
                    verificationStatus: 'Approved',
                    vehicleDetails: {
                        type: 'Bike',
                        model: '',
                        rcNumber: '',
                        licenseNumber: ''
                    },
                    documents: {
                        profilePhoto: '',
                        drivingLicense: '',
                        aadhaarProof: ''
                    }
                });
            }

            // Automatically enable delivery settings on the restaurant
            const restaurantDoc = await Restaurant.findById(req.user.restaurantId);
            if (restaurantDoc) {
                if (!restaurantDoc.deliverySettings) {
                    restaurantDoc.deliverySettings = { enabled: true };
                } else {
                    restaurantDoc.deliverySettings.enabled = true;
                }
                await restaurantDoc.save();
            }
        }
        
        const updatedStaff = await User.findById(staff._id).populate('branchId', 'name').select('-password');
        res.json(updatedStaff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all staff for a restaurant
// @route   GET /api/staff
// @access  Private
export const getStaff = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.user.restaurantId);
        const hasEnterprise = restaurant && (restaurant.plan === 'Enterprise' || restaurant.plan?.toLowerCase() === 'enterprise');

        const staffRoles = hasEnterprise
            ? ['BranchManager', 'Chef', 'Waiter', 'Cashier', 'DeliveryPartner']
            : ['BranchManager', 'Chef', 'Waiter', 'Cashier'];
        
        const staff = await User.find({ 
            restaurantId: req.user.restaurantId,
            role: { $in: staffRoles }
        }).populate('branchId', 'name').select('-password');
        
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new staff member
// @route   POST /api/staff
// @access  Private
export const createStaff = async (req, res) => {
    const { name, email, phone, role, branchId, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'A user with this email already exists' });
        }

        const restaurant = await Restaurant.findById(req.user.restaurantId);
        const hasEnterprise = restaurant && (restaurant.plan === 'Enterprise' || restaurant.plan?.toLowerCase() === 'enterprise');

        const validRoles = hasEnterprise
            ? ['BranchManager', 'Chef', 'Waiter', 'Cashier', 'DeliveryPartner']
            : ['BranchManager', 'Chef', 'Waiter', 'Cashier'];

        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid staff role' });
        }

        const user = await User.create({
            name,
            email,
            phoneNumber: phone,
            password: password || 'password123',
            role,
            restaurantId: req.user.restaurantId,
            branchId: branchId === '' ? null : branchId
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
                restaurantId: req.user.restaurantId,
                verificationStatus: 'Approved',
                vehicleDetails: {
                    type: 'Bike',
                    model: '',
                    rcNumber: '',
                    licenseNumber: ''
                },
                documents: {
                    profilePhoto: '',
                    drivingLicense: '',
                    aadhaarProof: ''
                }
            });

            // Automatically enable delivery settings on the restaurant
            const restaurantDoc = await Restaurant.findById(req.user.restaurantId);
            if (restaurantDoc) {
                if (!restaurantDoc.deliverySettings) {
                    restaurantDoc.deliverySettings = { enabled: true };
                } else {
                    restaurantDoc.deliverySettings.enabled = true;
                }
                await restaurantDoc.save();
            }
        }

        // Fetch populated
        const populatedUser = await User.findById(user._id).populate('branchId', 'name').select('-password');
        res.status(201).json(populatedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a staff member
// @route   DELETE /api/staff/:id
// @access  Private
export const deleteStaff = async (req, res) => {
    try {
        const staff = await User.findById(req.params.id);

        if (staff) {
            if (staff.restaurantId?.toString() !== req.user.restaurantId.toString()) {
                return res.status(403).json({ message: 'Not authorized to delete this staff' });
            }

            // Remove from manager fields of branches
            await Branch.updateMany({ manager: staff._id }, { $unset: { manager: 1 } });

            // If role is DeliveryPartner, delete profile too
            if (staff.role === 'DeliveryPartner') {
                await DeliveryPartner.deleteOne({ userId: staff._id });
            }

            await staff.deleteOne();
            res.json({ message: 'Staff member removed' });
        } else {
            res.status(404).json({ message: 'Staff member not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
