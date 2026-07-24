import MenuItem from '../models/MenuItem.js';

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
export const getMenuItems = async (req, res) => {
    try {
        const filter = { isActive: true };
        
        if (req.query.restaurantId) {
            filter.restaurantId = req.query.restaurantId;
        }
        if (req.query.branchId) {
            filter.$or = [
                { branchId: req.query.branchId },
                { branchId: { $exists: false } },
                { branchId: null }
            ];
        }
        
        // If staff is logged in, filter by their restaurant
        if (req.user && req.user.restaurantId) {
            filter.restaurantId = req.user.restaurantId;
            
            // If they belong to a specific branch, allow global items OR branch-specific items
            if (req.user.branchId) {
                filter.$or = [
                    { branchId: req.user.branchId },
                    { branchId: { $exists: false } },
                    { branchId: null }
                ];
            }
        }

        const items = await MenuItem.find(filter);
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a menu item
// @route   POST /api/menu
// @access  Private (Admin/Manager)
export const createMenuItem = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (req.user && req.user.restaurantId) {
            payload.restaurantId = req.user.restaurantId;
        }
        if (req.user && req.user.branchId) {
            payload.branchId = req.user.branchId;
        }
        const item = await MenuItem.create(payload);
        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a menu item
// @route   PUT /api/menu/:id
// @access  Private (Admin/Manager)
export const updateMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (item) {
            res.json(item);
        } else {
            res.status(404).json({ message: 'Menu item not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a menu item
// @route   DELETE /api/menu/:id
// @access  Private (Admin/Manager)
export const deleteMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (item) {
            await item.deleteOne();
            res.json({ message: 'Item removed' });
        } else {
            res.status(404).json({ message: 'Menu item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
