import mongoose from 'mongoose';
import Inventory from '../models/Inventory.js';
import WastageLog from '../models/WastageLog.js';
import Notification from '../models/Notification.js';
import Branch from '../models/Branch.js';
import MaterialPurchase from '../models/MaterialPurchase.js';
import StockMovement from '../models/StockMovement.js';
import Expense from '../models/Expense.js';
import Restaurant from '../models/Restaurant.js';

// Helper to resolve user's restaurantId safely
const getUserRestaurantId = async (user, queryOrBody = {}) => {
    let rId = user?.restaurantId || user?.restaurant;
    if (!rId && user?.branchId) {
        const branchDoc = await Branch.findById(user.branchId);
        if (branchDoc) rId = branchDoc.restaurantId;
    }
    if (!rId && queryOrBody?.restaurantId) {
        rId = queryOrBody.restaurantId;
    }
    if (!rId && user?.role === 'SuperAdmin') {
        const firstRest = await Restaurant.findOne().select('_id');
        if (firstRest) rId = firstRest._id;
    }
    return rId;
};

// @desc    Log wastage and adjust stock
// @route   POST /api/inventory/wastage
// @access  Private
export const logWastage = async (req, res) => {
    const { ingredientName, quantity, unit, reason, inventoryId } = req.body;

    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const branchId = req.user.branchId || req.body.branchId;

        const log = await WastageLog.create({
            ingredientName,
            quantity: Number(quantity),
            unit,
            reason,
            restaurantId,
            branchId
        });

        // If inventory item exists or specified, decrement stock and log movement
        let item = null;
        if (inventoryId) {
            item = await Inventory.findById(inventoryId);
        } else {
            item = await Inventory.findOne({
                itemName: { $regex: new RegExp(`^${ingredientName.trim()}$`, 'i') },
                branch: branchId
            });
        }

        if (item) {
            const prevQty = item.quantity;
            item.quantity = Math.max(0, item.quantity - Number(quantity));
            await item.save();

            await StockMovement.create({
                restaurantId,
                branchId: item.branch,
                inventoryItem: item._id,
                itemName: item.itemName,
                movementType: 'Wastage',
                quantityChanged: -Number(quantity),
                previousQuantity: prevQty,
                newQuantity: item.quantity,
                unit: item.unit,
                unitCost: item.pricePerUnit || 0,
                totalValue: (Number(quantity) * (item.pricePerUnit || 0)),
                reference: `Wastage Log #${log._id.toString().substring(18)}`,
                reason: reason || 'Kitchen Wastage',
                performedBy: req.user._id,
                date: new Date()
            });
        }

        // Notify manager
        await Notification.create({
            title: `Wastage Logged: ${ingredientName}`,
            desc: `${quantity} ${unit} wasted. Reason: ${reason}`,
            type: 'Info',
            restaurantId,
            branchId
        }).catch(() => {});

        res.status(201).json(log);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all inventory items with valuation & status
// @route   GET /api/inventory
// @access  Private
export const getInventory = async (req, res) => {
    try {
        const filter = {};
        const restaurantId = await getUserRestaurantId(req.user);

        if (req.user && req.user.role !== 'SuperAdmin') {
            if (req.user.branchId) {
                filter.branch = req.user.branchId;
            } else if (restaurantId) {
                const branches = await Branch.find({ restaurantId }).select('_id');
                filter.branch = { $in: branches.map(b => b._id) };
            } else {
                return res.json([]);
            }
        } else if (req.query.branch) {
            filter.branch = req.query.branch;
        }

        if (req.query.branchId && req.query.branchId !== 'All') {
            filter.branch = req.query.branchId;
        }

        if (req.query.category && req.query.category !== 'All Categories') {
            filter.category = req.query.category;
        }

        if (req.query.status) {
            if (req.query.status === 'Low Stock') {
                filter.$expr = { $and: [{ $gt: ['$quantity', 0] }, { $lte: ['$quantity', '$minStockLevel'] }] };
            } else if (req.query.status === 'Out of Stock') {
                filter.quantity = { $lte: 0 };
            } else if (req.query.status === 'In Stock') {
                filter.$expr = { $gt: ['$quantity', '$minStockLevel'] };
            }
        }

        if (req.query.search) {
            filter.itemName = { $regex: req.query.search, $options: 'i' };
        }
        
        const items = await Inventory.find(filter)
            .populate('branch', 'name')
            .populate('supplier', 'name phone email')
            .sort({ itemName: 1 });

        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create an inventory item
// @route   POST /api/inventory
// @access  Private
export const createInventoryItem = async (req, res) => {
    const { itemName, category, quantity, unit, minStockLevel, pricePerUnit, supplier, branch, description } = req.body;

    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const branchId = req.user.branchId || branch;

        if (!branchId) {
            return res.status(400).json({ message: 'Branch is required' });
        }

        const qty = Number(quantity) || 0;
        const price = Number(pricePerUnit) || 0;

        const item = await Inventory.create({
            restaurantId,
            itemName: itemName.trim(),
            category: category || 'General',
            quantity: qty,
            unit,
            minStockLevel: Number(minStockLevel) || 10,
            pricePerUnit: price,
            lastPurchasePrice: price,
            supplier: supplier || undefined,
            branch: branchId,
            description: description || ''
        });

        // Record initial stock movement if quantity > 0
        if (qty > 0) {
            await StockMovement.create({
                restaurantId,
                branchId,
                inventoryItem: item._id,
                itemName: item.itemName,
                movementType: 'Stock Adjustment',
                quantityChanged: qty,
                previousQuantity: 0,
                newQuantity: qty,
                unit: item.unit,
                unitCost: price,
                totalValue: qty * price,
                reference: 'Initial Stock Creation',
                reason: 'Initial Inventory Entry',
                performedBy: req.user._id,
                date: new Date()
            });
        }

        const populatedItem = await Inventory.findById(item._id)
            .populate('branch', 'name')
            .populate('supplier', 'name phone email');

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
        const item = await Inventory.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        const oldQty = item.quantity;
        const newQty = req.body.quantity !== undefined ? Number(req.body.quantity) : oldQty;

        // If manual quantity override was made, record adjustment
        if (req.body.quantity !== undefined && newQty !== oldQty) {
            const restaurantId = await getUserRestaurantId(req.user);
            await StockMovement.create({
                restaurantId,
                branchId: item.branch,
                inventoryItem: item._id,
                itemName: item.itemName,
                movementType: 'Stock Adjustment',
                quantityChanged: newQty - oldQty,
                previousQuantity: oldQty,
                newQuantity: newQty,
                unit: item.unit,
                unitCost: req.body.pricePerUnit !== undefined ? Number(req.body.pricePerUnit) : item.pricePerUnit,
                totalValue: Math.abs(newQty - oldQty) * (item.pricePerUnit || 0),
                reference: req.body.adjustmentReason || 'Manual Inventory Adjustment',
                reason: req.body.adjustmentReason || 'Stock count update',
                performedBy: req.user._id,
                date: new Date()
            });
        }

        Object.assign(item, req.body);
        await item.save();

        const populated = await Inventory.findById(item._id)
            .populate('branch', 'name')
            .populate('supplier', 'name phone email');

        res.json(populated);
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

// ─── MODULE 1: MATERIAL PURCHASES & INVOICES ──────────────────────────────────

// @desc    Record Material Purchase with items, tax, supplier, payment status
// @route   POST /api/inventory/purchases
// @access  Private
export const recordMaterialPurchase = async (req, res) => {
    const {
        branchId,
        supplier,
        supplierName,
        invoiceNumber,
        purchaseDate,
        items,
        subtotal,
        taxAmount,
        totalAmount,
        paidAmount,
        paymentMethod,
        paymentStatus,
        notes
    } = req.body;

    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const targetBranchId = branchId || req.user.branchId;

        if (!targetBranchId) {
            return res.status(400).json({ message: 'Branch is required' });
        }
        if (!items || !items.length) {
            return res.status(400).json({ message: 'Purchase items list cannot be empty' });
        }
        if (!invoiceNumber) {
            return res.status(400).json({ message: 'Invoice number is required' });
        }

        const tot = Number(totalAmount) || 0;
        const paid = Number(paidAmount !== undefined ? paidAmount : req.body.amountPaid) || 0;
        const balance = Math.max(0, tot - paid);

        let finalPaymentStatus = paymentStatus || (paid >= tot ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid'));

        // Safely extract supplier information
        const sName = supplierName || req.body.supplier?.name || (typeof supplier === 'string' && !mongoose.Types.ObjectId.isValid(supplier) ? supplier : 'General Supplier');
        const sPhone = req.body.supplierPhone || req.body.supplier?.phone || '';
        const sId = (supplier && mongoose.Types.ObjectId.isValid(supplier)) ? supplier : undefined;

        // Normalize items array
        const normalizedItems = (items || []).map(i => {
            const matId = i.material || i.materialId;
            const name = i.itemName || i.name || 'Raw Material';
            const qty = Number(i.quantity) || 1;
            const price = Number(i.unitPrice) || 0;
            const total = Number(i.totalCost || i.total || (qty * price));
            return {
                material: (matId && mongoose.Types.ObjectId.isValid(matId)) ? matId : undefined,
                itemName: name,
                category: i.category || 'General',
                quantity: qty,
                unit: i.unit || 'kg',
                unitPrice: price,
                taxPercent: Number(i.taxPercent || 0),
                taxAmount: Number(i.taxAmount || 0),
                totalCost: total
            };
        });

        // 1. Create MaterialPurchase
        const purchase = await MaterialPurchase.create({
            restaurantId,
            branchId: targetBranchId,
            supplier: sId,
            supplierName: sName,
            supplierPhone: sPhone,
            invoiceNumber,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
            items: normalizedItems,
            subtotal: Number(subtotal) || tot,
            taxAmount: Number(taxAmount) || 0,
            totalAmount: tot,
            paidAmount: paid,
            balanceDue: balance,
            paymentStatus: finalPaymentStatus,
            payments: paid > 0 ? [{
                amount: paid,
                paymentDate: purchaseDate ? new Date(purchaseDate) : new Date(),
                paymentMethod: paymentMethod || 'Bank Transfer',
                reference: req.body.paymentReference || `Initial Payment - Inv #${invoiceNumber}`,
                notes: notes || '',
                recordedBy: req.user._id
            }] : [],
            notes: notes || '',
            createdBy: req.user._id
        });

        // 2. Update stock levels and weighted average cost for each item & record StockMovement
        for (const itm of normalizedItems) {
            let invItem = itm.material ? await Inventory.findById(itm.material) : null;
            if (!invItem) {
                // Check by name in this branch
                invItem = await Inventory.findOne({
                    itemName: { $regex: new RegExp(`^${itm.itemName.trim()}$`, 'i') },
                    branch: targetBranchId
                });
            }

            const inQty = Number(itm.quantity);
            const inPrice = Number(itm.unitPrice);

            if (invItem) {
                const prevQty = invItem.quantity || 0;
                const prevPrice = invItem.pricePerUnit || 0;
                const newQty = prevQty + inQty;

                // Weighted Average Costing:
                // newCost = (prevQty * prevPrice + inQty * inPrice) / newQty
                let newAvgPrice = inPrice;
                if (newQty > 0) {
                    newAvgPrice = ((prevQty * prevPrice) + (inQty * inPrice)) / newQty;
                }

                invItem.quantity = newQty;
                invItem.pricePerUnit = Math.round(newAvgPrice * 100) / 100;
                invItem.lastPurchasePrice = inPrice;
                invItem.lastPurchaseDate = purchase.purchaseDate;
                if (sId) invItem.supplier = sId;
                await invItem.save();

                await StockMovement.create({
                    restaurantId,
                    branchId: targetBranchId,
                    inventoryItem: invItem._id,
                    itemName: invItem.itemName,
                    movementType: 'Purchase Received',
                    quantityChanged: inQty,
                    previousQuantity: prevQty,
                    newQuantity: newQty,
                    unit: invItem.unit,
                    unitCost: inPrice,
                    totalValue: inQty * inPrice,
                    reference: `Invoice #${invoiceNumber}`,
                    reason: `Material purchase from ${sName}`,
                    performedBy: req.user._id,
                    date: purchase.purchaseDate
                });
            } else {
                // Auto-create material item in Inventory
                const createdItem = await Inventory.create({
                    restaurantId,
                    branch: targetBranchId,
                    supplier: sId,
                    itemName: itm.itemName,
                    category: itm.category || 'General',
                    quantity: inQty,
                    unit: itm.unit,
                    minStockLevel: 10,
                    pricePerUnit: inPrice,
                    lastPurchasePrice: inPrice,
                    lastPurchaseDate: purchase.purchaseDate,
                    costingMethod: 'Weighted Average'
                });

                await StockMovement.create({
                    restaurantId,
                    branchId: targetBranchId,
                    inventoryItem: createdItem._id,
                    itemName: createdItem.itemName,
                    movementType: 'Purchase Received',
                    quantityChanged: inQty,
                    previousQuantity: 0,
                    newQuantity: inQty,
                    unit: createdItem.unit,
                    unitCost: inPrice,
                    totalValue: inQty * inPrice,
                    reference: `Invoice #${invoiceNumber}`,
                    reason: `New material created via purchase from ${sName}`,
                    performedBy: req.user._id,
                    date: purchase.purchaseDate
                });
            }
        }

        // 3. Connect to Expenses Management WITHOUT DOUBLE-COUNTING:
        // Record an Expense entry linked via source: 'Material Purchase' and sourceId: purchase._id.
        // It records the amount paid and outstanding balance clearly!
        const exp = await Expense.create({
            category: 'Material purchases',
            amount: tot,
            paidAmount: paid,
            balanceDue: balance,
            paymentStatus: finalPaymentStatus === 'Paid' ? 'Paid' : (finalPaymentStatus === 'Partially Paid' ? 'Partially Paid' : 'Pending'),
            paymentMethod: paymentMethod || 'Bank Transfer',
            paymentDate: paid > 0 ? purchase.purchaseDate : undefined,
            description: `Material Purchase - Inv #${invoiceNumber} (${supplierName || 'Supplier'})`,
            date: purchase.purchaseDate,
            billingPeriod: purchase.purchaseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            staff: req.user.name || 'Admin',
            restaurantId,
            branchId: targetBranchId,
            source: 'Material Purchase',
            sourceId: purchase._id,
            createdBy: req.user._id,
            notes: notes || `Auto-linked from Material Purchase #${invoiceNumber}`
        });

        purchase.linkedExpenseId = exp._id;
        await purchase.save();

        const populatedPurchase = await MaterialPurchase.findById(purchase._id)
            .populate('branchId', 'name')
            .populate('supplier', 'name phone email')
            .populate('items.material', 'itemName unit quantity');

        res.status(201).json(populatedPurchase);
    } catch (error) {
        console.error('Error recording material purchase:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get material purchases with date, supplier, category, paymentStatus filtering
// @route   GET /api/inventory/purchases
// @access  Private
export const getMaterialPurchases = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const filter = { restaurantId };

        if (req.user.branchId) {
            filter.branchId = req.user.branchId;
        } else if (req.query.branchId && req.query.branchId !== 'All') {
            filter.branchId = req.query.branchId;
        }

        if (req.query.supplier && req.query.supplier !== 'All') {
            filter.supplier = req.query.supplier;
        }

        if (req.query.paymentStatus && req.query.paymentStatus !== 'All') {
            filter.paymentStatus = req.query.paymentStatus;
        }

        // Date / Period filtering
        if (req.query.period && req.query.period !== 'all') {
            const now = new Date();
            let start = new Date();
            let end = new Date();
            
            if (req.query.period === 'today') {
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
            } else if (req.query.period === 'yesterday') {
                start.setDate(start.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setDate(end.getDate() - 1);
                end.setHours(23, 59, 59, 999);
            } else if (req.query.period === 'last7days') {
                start.setDate(start.getDate() - 7);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
            } else if (req.query.period === 'thismonth') {
                start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            } else if (req.query.period === 'lastmonth') {
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            }
            filter.purchaseDate = { $gte: start, $lte: end };
        } else if (req.query.startDate || req.query.endDate) {
            filter.purchaseDate = {};
            if (req.query.startDate) {
                const s = new Date(req.query.startDate);
                s.setHours(0, 0, 0, 0);
                filter.purchaseDate.$gte = s;
            }
            if (req.query.endDate) {
                const e = new Date(req.query.endDate);
                e.setHours(23, 59, 59, 999);
                filter.purchaseDate.$lte = e;
            }
        }

        const purchases = await MaterialPurchase.find(filter)
            .populate('branchId', 'name')
            .populate('supplier', 'name phone email')
            .sort({ purchaseDate: -1, createdAt: -1 });

        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Record payment on material purchase invoice
// @route   POST /api/inventory/purchases/:id/pay
// @access  Private
export const recordMaterialPurchasePayment = async (req, res) => {
    const { amount, paymentMethod, reference, notes, paymentDate } = req.body;

    try {
        const purchase = await MaterialPurchase.findById(req.params.id);
        if (!purchase) {
            return res.status(404).json({ message: 'Purchase invoice not found' });
        }

        const payAmount = Number(amount);
        if (!payAmount || payAmount <= 0) {
            return res.status(400).json({ message: 'Valid payment amount is required' });
        }

        const newPaid = Math.min(purchase.totalAmount, (purchase.paidAmount || 0) + payAmount);
        const newBalance = Math.max(0, purchase.totalAmount - newPaid);
        const newStatus = newPaid >= purchase.totalAmount ? 'Paid' : (newPaid > 0 ? 'Partially Paid' : 'Unpaid');

        purchase.paidAmount = newPaid;
        purchase.balanceDue = newBalance;
        purchase.paymentStatus = newStatus;
        purchase.payments.push({
            amount: payAmount,
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            paymentMethod: paymentMethod || 'Bank Transfer',
            reference: reference || '',
            notes: notes || '',
            recordedBy: req.user._id
        });

        await purchase.save();

        // Update linked expense record
        if (purchase.linkedExpenseId) {
            const exp = await Expense.findById(purchase.linkedExpenseId);
            if (exp) {
                exp.paidAmount = newPaid;
                exp.balanceDue = newBalance;
                exp.paymentStatus = newStatus === 'Paid' ? 'Paid' : (newStatus === 'Partially Paid' ? 'Partially Paid' : 'Pending');
                exp.paymentDate = new Date();
                exp.payments.push({
                    amount: payAmount,
                    paidDate: paymentDate ? new Date(paymentDate) : new Date(),
                    paymentMethod: paymentMethod || 'Bank Transfer',
                    reference: reference || '',
                    notes: notes || '',
                    recordedBy: req.user._id
                });
                await exp.save();
            }
        }

        res.json(purchase);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get stock movement history
// @route   GET /api/inventory/stock-movements
// @access  Private
export const getStockMovements = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const filter = { restaurantId };

        if (req.user.branchId) {
            filter.branchId = req.user.branchId;
        } else if (req.query.branchId && req.query.branchId !== 'All') {
            filter.branchId = req.query.branchId;
        }

        if (req.query.inventoryItem) {
            filter.inventoryItem = req.query.inventoryItem;
        }

        if (req.query.movementType && req.query.movementType !== 'All') {
            filter.movementType = req.query.movementType;
        }

        if (req.query.startDate || req.query.endDate) {
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

        const movements = await StockMovement.find(filter)
            .populate('branchId', 'name')
            .populate('performedBy', 'name role')
            .sort({ date: -1 })
            .limit(100);

        res.json(movements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Record manual stock adjustment (damaged, physical recount, etc.)
// @route   POST /api/inventory/stock-adjustments
// @access  Private
export const recordStockAdjustment = async (req, res) => {
    const { inventoryId, newQuantity, movementType, reason, reference } = req.body;

    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const item = await Inventory.findById(inventoryId);
        if (!item) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        const prevQty = item.quantity;
        const targetQty = Number(newQuantity);
        const qtyDiff = targetQty - prevQty;

        item.quantity = Math.max(0, targetQty);
        await item.save();

        const movement = await StockMovement.create({
            restaurantId,
            branchId: item.branch,
            inventoryItem: item._id,
            itemName: item.itemName,
            movementType: movementType || 'Stock Adjustment',
            quantityChanged: qtyDiff,
            previousQuantity: prevQty,
            newQuantity: item.quantity,
            unit: item.unit,
            unitCost: item.pricePerUnit || 0,
            totalValue: Math.abs(qtyDiff) * (item.pricePerUnit || 0),
            reference: reference || 'Manual Adjustment',
            reason: reason || 'Inventory Reconciliation',
            performedBy: req.user._id,
            date: new Date()
        });

        res.status(201).json({ item, movement });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get inventory valuation, category breakdown, and alerts
// @route   GET /api/inventory/valuation
// @access  Private
export const getInventoryValuation = async (req, res) => {
    try {
        const restaurantId = await getUserRestaurantId(req.user);
        const filter = {};

        if (req.user.branchId) {
            filter.branch = req.user.branchId;
        } else if (restaurantId) {
            const branches = await Branch.find({ restaurantId }).select('_id');
            filter.branch = { $in: branches.map(b => b._id) };
        }

        if (req.query.branchId && req.query.branchId !== 'All') {
            filter.branch = new mongoose.Types.ObjectId(req.query.branchId);
        }

        const items = await Inventory.find(filter);

        let totalValuation = 0;
        let totalItems = items.length;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        const categoryMap = {};

        for (const itm of items) {
            const val = (itm.quantity || 0) * (itm.pricePerUnit || 0);
            totalValuation += val;

            if (itm.quantity <= 0) {
                outOfStockCount++;
            } else if (itm.quantity <= itm.minStockLevel) {
                lowStockCount++;
            }

            const cat = itm.category || 'General';
            categoryMap[cat] = (categoryMap[cat] || 0) + val;
        }

        const categoryBreakdown = Object.entries(categoryMap).map(([category, value]) => ({
            category,
            value: Math.round(value * 100) / 100
        })).sort((a, b) => b.value - a.value);

        res.json({
            totalValuation: Math.round(totalValuation * 100) / 100,
            totalItems,
            lowStockCount,
            outOfStockCount,
            categoryBreakdown
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
