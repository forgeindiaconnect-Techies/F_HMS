import Category from '../models/Category.js';

// @desc    Get all categories for a restaurant/branch
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res) => {
    try {
        const filter = {};
        
        if (req.user && req.user.role !== 'SuperAdmin') {
            if (req.user.branchId) {
                filter.branch = req.user.branchId;
            } else if (req.user.restaurantId) {
                const Branch = (await import('../models/Branch.js')).default;
                const branches = await Branch.find({ restaurantId: req.user.restaurantId }).select('_id');
                filter.branch = { $in: branches.map(b => b._id) };
            } else {
                return res.json([]);
            }
        } else if (req.query.branch) {
            filter.branch = req.query.branch;
        }
        
        const categories = await Category.find(filter).populate('branch', 'name');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private
export const createCategory = async (req, res) => {
    const { name, description, branch, isActive } = req.body;

    try {
        const category = await Category.create({
            name,
            description,
            branch: req.user.branchId || branch, // Use user's branch if they have one, else from body
            isActive: isActive !== undefined ? isActive : true
        });

        const populatedCategory = await Category.findById(category._id).populate('branch', 'name');
        res.status(201).json(populatedCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private
export const updateCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('branch', 'name');
        if (category) {
            res.json(category);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (category) {
            await category.deleteOne();
            res.json({ message: 'Category removed' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
