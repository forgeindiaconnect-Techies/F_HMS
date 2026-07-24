import mongoose from 'mongoose';
import Table from '../models/Table.js';
import Order from '../models/Order.js';

// @desc    Get all tables for a branch
// @route   GET /api/tables
// @access  Private
export const getTables = async (req, res) => {
    try {
        const filter = { restaurantId: req.user.restaurantId };
        
        const queryBranchId = req.query.branchId;
        if (queryBranchId) {
            filter.branchId = queryBranchId;
        } else if (req.user.branchId) {
            filter.branchId = req.user.branchId;
        }
        
        const tables = await Table.find(filter).populate('activeOrder').populate('branchId');
        res.json(tables);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a table
// @route   POST /api/tables
// @access  Private (Admin/Manager)
export const createTable = async (req, res) => {
    const { tableNumber, capacity, branchId } = req.body;
    try {
        let finalBranchId = branchId || req.user.branchId;

        if (!finalBranchId) {
            const Branch = mongoose.model('Branch');
            const firstBranch = await Branch.findOne({ restaurantId: req.user.restaurantId });
            if (firstBranch) {
                finalBranchId = firstBranch._id;
            }
        }

        if (!finalBranchId) {
            res.status(400).json({ message: 'Branch ID is required to create a table. Please create a branch first.' });
            return;
        }

        const table = await Table.create({
            restaurantId: req.user.restaurantId,
            branchId: finalBranchId,
            tableNumber,
            capacity: capacity || 4,
            status: 'Available'
        });
        res.status(201).json(table);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Failed to create table' });
    }
};

// @desc    Update table status
// @route   PUT /api/tables/:id/status
// @access  Private
export const updateTableStatus = async (req, res) => {
    const { status, customers, activeOrder } = req.body;
    try {
        const table = await Table.findById(req.params.id);
        if (table) {
            table.status = status || table.status;
            if (customers !== undefined) table.customers = customers;
            if (activeOrder !== undefined) table.activeOrder = activeOrder;
            
            const updatedTable = await table.save();
            res.json(updatedTable);
        } else {
            res.status(404).json({ message: 'Table not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Failed to update table' });
    }
};
