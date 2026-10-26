import KOT from '../models/KOT.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import Branch from '../models/Branch.js';
import mongoose from 'mongoose';
import { validateKOTStatusTransition, getNextKotNumber, determineKitchenStation } from '../utils/kotHelper.js';
import { broadcastToRestaurant } from '../config/websocket.js';

// Helper to extract clean ID
const extractId = (id) => {
    if (!id) return null;
    if (typeof id === 'object') return String(id._id || id.id || id);
    return String(id);
};

// @desc    Get all KOTs scoped to user's restaurant/branch with filters
// @route   GET /api/kot
// @access  Private (Chef, Waiter, Cashier, Manager, Admin)
export const getKOTs = async (req, res) => {
    try {
        const restaurantId = extractId(req.user?.restaurantId);
        if (!restaurantId && req.user?.role !== 'SuperAdmin') {
            return res.status(403).json({ message: 'Restaurant access not configured for user.' });
        }

        const query = {};
        if (req.user?.role !== 'SuperAdmin') {
            query.restaurantId = restaurantId;
        }

        // Branch scoping
        const branchId = extractId(req.query.branchId || req.user?.branchId);
        if (branchId && req.user?.role !== 'SuperAdmin' && req.user?.role !== 'RestaurantAdmin') {
            query.branchId = branchId;
        }

        // Status filter
        if (req.query.status && req.query.status !== 'All') {
            if (req.query.status === 'Active') {
                query.status = { $in: ['Pending', 'Preparing', 'Ready'] };
            } else {
                query.status = req.query.status;
            }
        }

        // Kitchen station filter
        if (req.query.station && req.query.station !== 'All') {
            query.kitchenStation = req.query.station;
        }

        // Order ID filter
        if (req.query.orderId) {
            query.orderId = req.query.orderId;
        }

        // Table number filter
        if (req.query.tableNumber) {
            query.tableNumber = new RegExp(req.query.tableNumber, 'i');
        }

        // Date range filter (Default to today unless specified or all)
        if (req.query.date === 'today') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            query.createdAt = { $gte: startOfDay };
        } else if (req.query.startDate && req.query.endDate) {
            query.createdAt = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        const kots = await KOT.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(req.query.limit) || 150);

        return res.status(200).json(kots);
    } catch (error) {
        console.error('Error fetching KOTs:', error);
        return res.status(500).json({ message: error.message || 'Server error fetching KOTs' });
    }
};

// @desc    Get single KOT with complete details for thermal printing
// @route   GET /api/kot/:id
// @access  Private (Staff)
export const getKOTById = async (req, res) => {
    try {
        const kot = await KOT.findById(req.params.id);
        if (!kot) {
            return res.status(404).json({ message: 'Kitchen Order Ticket not found' });
        }

        // Restaurant data isolation check
        const userRestId = extractId(req.user?.restaurantId);
        if (userRestId && req.user?.role !== 'SuperAdmin' && String(kot.restaurantId) !== userRestId) {
            return res.status(403).json({ message: 'Not authorized to view KOT from another restaurant.' });
        }

        // Fetch Restaurant & Branch details for print header
        const [restaurant, branch] = await Promise.all([
            Restaurant.findById(kot.restaurantId).select('name logo address phone'),
            Branch.findById(kot.branchId).select('name address phone')
        ]);

        return res.status(200).json({
            ...kot.toObject(),
            restaurantName: restaurant?.name || 'Restaurant',
            restaurantAddress: restaurant?.address || '',
            restaurantPhone: restaurant?.phone || '',
            branchName: branch?.name || 'Main Branch',
            branchAddress: branch?.address || '',
            branchPhone: branch?.phone || ''
        });
    } catch (error) {
        console.error('Error fetching KOT by ID:', error);
        return res.status(500).json({ message: error.message || 'Server error fetching KOT' });
    }
};

// @desc    Update KOT status (e.g. Preparing -> Ready -> Served)
// @route   PUT /api/kot/:id/status
// @access  Private (Chef, Waiter, Manager)
export const updateKOTStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: 'New status is required' });
        }

        const kot = await KOT.findById(req.params.id);
        if (!kot) {
            return res.status(404).json({ message: 'KOT not found' });
        }

        // Security scoping check
        const userRestId = extractId(req.user?.restaurantId);
        if (userRestId && req.user?.role !== 'SuperAdmin' && String(kot.restaurantId) !== userRestId) {
            return res.status(403).json({ message: 'Not authorized to update this KOT' });
        }

        // Validate state transitions
        const validation = validateKOTStatusTransition(kot.status, status);
        if (!validation.valid) {
            return res.status(400).json({ message: validation.message });
        }

        const oldStatus = kot.status;
        kot.status = status;

        const now = new Date();
        if (status === 'Preparing' && !kot.prepStartTime) {
            kot.prepStartTime = now;
        } else if (status === 'Ready' && !kot.prepReadyTime) {
            kot.prepReadyTime = now;
        } else if (status === 'Served' && !kot.servedTime) {
            kot.servedTime = now;
        }

        kot.statusHistory.push({
            status,
            timestamp: now,
            updatedBy: req.user?._id || null
        });

        // Also update individual items status
        if (kot.items && kot.items.length > 0) {
            kot.items.forEach(item => {
                if (item.status !== 'Cancelled') {
                    item.status = status;
                }
            });
        }

        const updatedKOT = await kot.save();

        // Check if all KOTs for the parent order have reached Ready or Served
        if (kot.orderId) {
            try {
                const siblingKOTs = await KOT.find({ orderId: kot.orderId });
                const nonCancelledKOTs = siblingKOTs.filter(k => k.status !== 'Cancelled');

                if (nonCancelledKOTs.length > 0) {
                    const allReadyOrBeyond = nonCancelledKOTs.every(k => ['Ready', 'Served'].includes(k.status));
                    const allServed = nonCancelledKOTs.every(k => k.status === 'Served');

                    const parentOrder = await Order.findById(kot.orderId);
                    if (parentOrder) {
                        if (allServed && !['Served', 'Completed'].includes(parentOrder.status)) {
                            parentOrder.status = 'Served';
                            await parentOrder.save();
                        } else if (allReadyOrBeyond && !['Ready', 'Ready for Pickup', 'Served', 'Completed'].includes(parentOrder.status)) {
                            parentOrder.status = (parentOrder.orderType === 'Self-Pickup' || parentOrder.serviceType?.includes('Self'))
                                ? 'Ready for Pickup'
                                : 'Ready';
                            await parentOrder.save();
                        }
                    }
                }
            } catch (syncErr) {
                console.error('Error synchronizing parent order with KOT statuses', syncErr);
            }
        }

        // Broadcast real-time WebSocket update
        broadcastToRestaurant(kot.restaurantId, 'kot_status_updated', {
            kotId: kot._id,
            kotNumber: kot.kotNumber,
            orderId: kot.orderId,
            tableNumber: kot.tableNumber,
            kitchenStation: kot.kitchenStation,
            oldStatus,
            newStatus: status,
            updatedKOT
        });

        if (status === 'Ready') {
            broadcastToRestaurant(kot.restaurantId, 'ready_to_serve', {
                orderId: kot.orderId,
                kotNumber: kot.kotNumber,
                tableNumber: kot.tableNumber,
                customerName: kot.customerName,
                serviceType: kot.serviceType,
                status: 'Ready'
            });
        }

        return res.status(200).json(updatedKOT);
    } catch (error) {
        console.error('Error updating KOT status:', error);
        return res.status(500).json({ message: error.message || 'Server error updating KOT' });
    }
};

// @desc    Mark KOT as printed (audit log for thermal printing)
// @route   PUT /api/kot/:id/print
// @access  Private (Staff)
export const markKOTPrinted = async (req, res) => {
    try {
        const kot = await KOT.findById(req.params.id);
        if (!kot) {
            return res.status(404).json({ message: 'KOT not found' });
        }

        // Security check
        const userRestId = extractId(req.user?.restaurantId);
        if (userRestId && req.user?.role !== 'SuperAdmin' && String(kot.restaurantId) !== userRestId) {
            return res.status(403).json({ message: 'Not authorized for this KOT' });
        }

        kot.isPrinted = true;
        kot.printedAt = new Date();
        kot.printCount = (kot.printCount || 0) + 1;

        const updatedKOT = await kot.save();
        return res.status(200).json({
            message: 'KOT marked as printed',
            printCount: updatedKOT.printCount,
            printedAt: updatedKOT.printedAt,
            kot: updatedKOT
        });
    } catch (error) {
        console.error('Error marking KOT as printed:', error);
        return res.status(500).json({ message: error.message || 'Server error updating print status' });
    }
};

// @desc    Manual or Ad-hoc KOT creation (Staff fire / urgent dish)
// @route   POST /api/kot
// @access  Private (Waiter, Cashier, Chef, Manager)
export const manualCreateKOT = async (req, res) => {
    try {
        const { orderId, items, tableNumber, notes, kitchenStation, customerName } = req.body;
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Items list is required for KOT' });
        }

        let restaurantId = extractId(req.user?.restaurantId);
        let branchId = extractId(req.user?.branchId);

        let order = null;
        if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
            order = await Order.findById(orderId);
            if (order) {
                restaurantId = restaurantId || extractId(order.restaurantId);
                branchId = branchId || extractId(order.branchId);
            }
        }

        if (!restaurantId) {
            return res.status(400).json({ message: 'Restaurant ID missing' });
        }
        if (!branchId) {
            const firstBranch = await Branch.findOne({ restaurantId });
            branchId = firstBranch?._id;
        }

        const { kotNumber, kotSequence } = await getNextKotNumber(restaurantId, branchId);
        const station = kitchenStation || (items[0] ? determineKitchenStation(items[0]) : 'Main Kitchen');

        const kot = new KOT({
            kotNumber,
            kotSequence,
            orderId: order ? order._id : new mongoose.Types.ObjectId(),
            orderNumber: order ? `#${String(order._id).slice(-5).toUpperCase()}` : 'MANUAL',
            restaurantId,
            branchId,
            tableNumber: tableNumber || order?.tableNumber || '',
            orderType: order?.orderType || 'Dine In',
            serviceType: order?.serviceType || 'Waiter Table Service',
            customerName: customerName || order?.customerName || '',
            kitchenStation: station,
            items: items.map(i => ({
                name: i.name,
                qty: Number(i.qty) || 1,
                price: Number(i.price) || 0,
                notes: i.notes || '',
                product: (i.product && mongoose.Types.ObjectId.isValid(i.product)) ? i.product : null,
                kitchenStation: station,
                status: 'Pending'
            })),
            notes: notes || '',
            status: 'Pending',
            statusHistory: [{
                status: 'Pending',
                timestamp: new Date(),
                updatedBy: req.user?._id || null
            }],
            serverName: req.user?.name || 'Staff User',
            createdBy: req.user?._id || null
        });

        const savedKOT = await kot.save();

        if (order) {
            await Order.findByIdAndUpdate(order._id, {
                $addToSet: {
                    kots: savedKOT._id,
                    kotNumbers: savedKOT.kotNumber
                }
            });
        }

        broadcastToRestaurant(restaurantId, 'new_kot', savedKOT);

        return res.status(201).json(savedKOT);
    } catch (error) {
        console.error('Error creating manual KOT:', error);
        return res.status(500).json({ message: error.message || 'Server error creating KOT' });
    }
};

// @desc    Get KOT analytics summary (Counts today, avg prep duration)
// @route   GET /api/kot/summary
// @access  Private (Chef, Manager, Admin)
export const getKOTSummary = async (req, res) => {
    try {
        const restaurantId = extractId(req.user?.restaurantId);
        const query = {};
        if (restaurantId && req.user?.role !== 'SuperAdmin') {
            query.restaurantId = restaurantId;
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        query.createdAt = { $gte: startOfDay };

        const todayKOTs = await KOT.find(query);

        const totalToday = todayKOTs.length;
        const pendingCount = todayKOTs.filter(k => k.status === 'Pending').length;
        const preparingCount = todayKOTs.filter(k => k.status === 'Preparing').length;
        const readyCount = todayKOTs.filter(k => k.status === 'Ready').length;
        const servedCount = todayKOTs.filter(k => k.status === 'Served').length;
        const cancelledCount = todayKOTs.filter(k => k.status === 'Cancelled').length;

        // Calculate average prep time in minutes (from prepStartTime to prepReadyTime)
        const completedPrep = todayKOTs.filter(k => k.prepStartTime && k.prepReadyTime);
        let avgPrepMinutes = 12; // Standard default
        if (completedPrep.length > 0) {
            const totalMs = completedPrep.reduce((acc, curr) => {
                const diff = new Date(curr.prepReadyTime) - new Date(curr.prepStartTime);
                return acc + (diff > 0 ? diff : 0);
            }, 0);
            avgPrepMinutes = Math.round(totalMs / (completedPrep.length * 60 * 1000)) || 1;
        }

        return res.status(200).json({
            totalToday,
            pendingCount,
            preparingCount,
            readyCount,
            servedCount,
            cancelledCount,
            avgPrepMinutes
        });
    } catch (error) {
        console.error('Error fetching KOT summary:', error);
        return res.status(500).json({ message: error.message || 'Server error fetching KOT summary' });
    }
};
