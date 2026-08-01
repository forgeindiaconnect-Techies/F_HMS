import User from '../models/User.js';

// @desc    Get all users for a restaurant
// @route   GET /api/users
// @access  Private
export const getUsers = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'SuperAdmin' && req.user.role !== 'SupportAgent') {
            query.restaurantId = req.user.restaurantId;
        }

        const users = await User.find(query)
            .populate('branchId', 'name')
            .select('-password');
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Invite a new user
// @route   POST /api/users
// @access  Private
export const inviteUser = async (req, res) => {
    const { name, email, role, branchId } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'A user with this email already exists' });
        }

        const validRoles = ['RestaurantAdmin', 'BranchManager', 'Chef', 'Waiter', 'Cashier', 'Customer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.create({
            name,
            email,
            password: 'password123',
            role,
            restaurantId: req.user.restaurantId,
            branchId: branchId || null
        });

        const populatedUser = await User.findById(user._id).populate('branchId', 'name').select('-password');
        res.status(201).json(populatedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private
export const deleteUser = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);

        if (targetUser) {
            if (req.user.role !== 'SuperAdmin' && req.user.role !== 'SupportAgent' && targetUser.restaurantId?.toString() !== req.user.restaurantId?.toString()) {
                return res.status(403).json({ message: 'Not authorized to delete this user' });
            }
            
            // Prevent deleting yourself
            if (targetUser._id.toString() === req.user._id.toString()) {
                return res.status(400).json({ message: 'You cannot delete your own account' });
            }

            await targetUser.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
