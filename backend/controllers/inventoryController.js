import Inventory from '../models/Inventory.js';
import WastageLog from '../models/WastageLog.js';
import Notification from '../models/Notification.js';

// @desc    Log wastage
// @route   POST /api/inventory/wastage
// @access  Private
export const logWastage = async (req, res) => {
    const { ingredientName, quantity, unit, reason } = req.body;

    try {
        const log = await WastageLog.create({
            ingredientName,
            quantity,
            unit,
            reason,
            restaurantId: req.user.restaurantId,
            branchId: req.user.branchId
        });

        // Optional: Notify manager
        await Notification.create({
            title: `Wastage Logged: ${ingredientName}`,
            desc: `${quantity} ${unit} wasted. Reason: ${reason}`,
            type: 'Info',
            restaurantId: req.user.restaurantId,
            branchId: req.user.branchId
        });

        res.status(201).json(log);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
export const getInventory = async (req, res) => {
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
        
        const items = await Inventory.find(filter).populate('branch', 'name');
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create an inventory item
// @route   POST /api/inventory
// @access  Private
export const createInventoryItem = async (req, res) => {
    const { itemName, category, quantity, unit, minStockLevel, branch } = req.body;

    try {
        const item = await Inventory.create({
            itemName,
            category,
            quantity,
            unit,
            minStockLevel,
            branch: req.user.branchId || branch // Use user's branch if they have one, else from body
        });

        const populatedItem = await Inventory.findById(item._id).populate('branch', 'name');
        res.status(201).json(populatedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update an inventory item
// @route   PUT /api/inventory/:id
// @access  Private
export const updateInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('branch', 'name');
        if (item) {
            res.json(item);
        } else {
            res.status(404).json({ message: 'Inventory item not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete an inventory item
// @route   DELETE /api/inventory/:id
// @access  Private
export const deleteInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (item) {
            await item.deleteOne();
            res.json({ message: 'Item removed' });
        } else {
            res.status(404).json({ message: 'Inventory item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
