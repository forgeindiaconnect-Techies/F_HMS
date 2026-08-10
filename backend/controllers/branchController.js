import Branch from '../models/Branch.js';
import Restaurant from '../models/Restaurant.js';
import Plan from '../models/Plan.js';


// @desc    Get all branches for a restaurant
// @route   GET /api/branches
// @access  Private
export const getBranches = async (req, res) => {
    try {
        const branches = await Branch.find({ restaurantId: req.user.restaurantId }).populate('manager', 'name email');
        res.json(branches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new branch
// @route   POST /api/branches
// @access  Private
export const createBranch = async (req, res) => {
    const { name, location, contact, isActive } = req.body;

    try {
        const restaurant = req.restaurant || await Restaurant.findById(req.user.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const planName = restaurant.subscription?.plan || 'Basic';
        const planDoc = await Plan.findOne({ name: planName });
        let branchLimit = 1; // Default to 1 (Basic limit)
        
        if (planDoc && planDoc.branchesLimit !== undefined) {
            branchLimit = planDoc.branchesLimit;
        } else {
            // Fallbacks
            if (planName === 'Pro' || planName === 'Professional') {
                branchLimit = 5;
            } else if (planName === 'Enterprise') {
                branchLimit = Infinity;
            }
        }

        // Count existing branches
        const currentBranchesCount = await Branch.countDocuments({ restaurantId: req.user.restaurantId });
        
        if (currentBranchesCount >= branchLimit) {
            return res.status(403).json({ 
                message: `Your current plan (${planName}) only allows up to ${branchLimit} branch${branchLimit > 1 ? 'es' : ''}. Please upgrade your subscription plan to add more branches.`,
                limitExceeded: true
            });
        }

        const branch = await Branch.create({
            restaurantId: req.user.restaurantId,
            name,
            location,
            contact,
            isActive
        });

        res.status(201).json(branch);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


// @desc    Update a branch
// @route   PUT /api/branches/:id
// @access  Private
export const updateBranch = async (req, res) => {
    const { name, location, contact, isActive } = req.body;

    try {
        const branch = await Branch.findById(req.params.id);

        if (branch) {
            // Check if branch belongs to user's restaurant
            if (branch.restaurantId.toString() !== req.user.restaurantId.toString()) {
                return res.status(403).json({ message: 'Not authorized to update this branch' });
            }

            branch.name = name || branch.name;
            branch.location = location || branch.location;
            branch.contact = contact || branch.contact;
            if (isActive !== undefined) branch.isActive = isActive;

            const updatedBranch = await branch.save();
            const populatedBranch = await Branch.findById(updatedBranch._id).populate('manager', 'name email');
            res.json(populatedBranch);
        } else {
            res.status(404).json({ message: 'Branch not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a branch
// @route   DELETE /api/branches/:id
// @access  Private
export const deleteBranch = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id);

        if (branch) {
            if (branch.restaurantId.toString() !== req.user.restaurantId.toString()) {
                return res.status(403).json({ message: 'Not authorized to delete this branch' });
            }

            await branch.deleteOne();
            res.json({ message: 'Branch removed' });
        } else {
            res.status(404).json({ message: 'Branch not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
