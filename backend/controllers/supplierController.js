import Supplier from '../models/Supplier.js';
import Branch from '../models/Branch.js';

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
export const getSuppliers = async (req, res) => {
    try {
        const filter = {};
        
        // If staff is logged in, filter by their branch; else scope to restaurant branches
        if (req.user && req.user.branchId) {
            filter.branch = req.user.branchId;
        } else if (req.query.branch) {
            filter.branch = req.query.branch;
        } else if (req.user?.restaurantId) {
            const branches = await Branch.find({ restaurantId: req.user.restaurantId }).select('_id').lean();
            filter.branch = { $in: branches.map(b => b._id) };
        }
        
        const suppliers = await Supplier.find(filter).populate('branch', 'name');
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a supplier
// @route   POST /api/suppliers
// @access  Private
export const createSupplier = async (req, res) => {
    const { name, category, contactPerson, phone, email, address, branch, isActive } = req.body;

    try {
        const cleanPhone = String(phone || '').replace(/\D/g, '');
        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
            return res.status(400).json({ message: 'Phone number must be exactly 10 digits starting with 6, 7, 8, or 9.' });
        }

        let targetBranch = req.user.branchId || branch;
        if (!targetBranch && req.user?.restaurantId) {
            const defaultBranch = await Branch.findOne({ restaurantId: req.user.restaurantId }).select('_id').lean();
            if (defaultBranch) targetBranch = defaultBranch._id;
        }
        if (!targetBranch) {
            return res.status(400).json({ message: 'Please assign a branch to this supplier.' });
        }

        const supplier = await Supplier.create({
            name,
            category,
            contactPerson,
            phone: cleanPhone,
            email,
            address,
            branch: targetBranch,
            isActive: isActive !== undefined ? isActive : true
        });

        const populatedSupplier = await Supplier.findById(supplier._id).populate('branch', 'name');
        res.status(201).json(populatedSupplier);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a supplier
// @route   PUT /api/suppliers/:id
// @access  Private
export const updateSupplier = async (req, res) => {
    try {
        const updates = { ...req.body };
        if (updates.phone !== undefined) {
            const cleanPhone = String(updates.phone || '').replace(/\D/g, '');
            if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
                return res.status(400).json({ message: 'Phone number must be exactly 10 digits starting with 6, 7, 8, or 9.' });
            }
            updates.phone = cleanPhone;
        }
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('branch', 'name');
        if (supplier) {
            res.json(supplier);
        } else {
            res.status(404).json({ message: 'Supplier not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a supplier
// @route   DELETE /api/suppliers/:id
// @access  Private
export const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (supplier) {
            await supplier.deleteOne();
            res.json({ message: 'Supplier removed' });
        } else {
            res.status(404).json({ message: 'Supplier not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
