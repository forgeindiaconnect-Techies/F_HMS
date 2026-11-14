import Notification from '../models/Notification.js';
import Inventory from '../models/Inventory.js';
import MaterialPurchase from '../models/MaterialPurchase.js';
import StockMovement from '../models/StockMovement.js';
import Branch from '../models/Branch.js';
import Supplier from '../models/Supplier.js';
import { broadcastToRestaurant } from '../config/websocket.js';

const resolveUserRestaurantId = async (user) => {
    if (user?.restaurantId) return user.restaurantId;
    if (user?.branchId) {
        const b = await Branch.findById(user.branchId).select('restaurantId');
        if (b?.restaurantId) return b.restaurantId;
    }
    return null;
};

// @desc    Get all notifications for the restaurant
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
    try {
        const { role, restaurantId } = req.user;
        const userId = req.user._id;

        let query = {};

        if (role === 'SuperAdmin') {
            query = { isSuperAdminOnly: true };
        } else if (role === 'RestaurantAdmin' || role === 'Admin') {
            query = {
                $or: [
                    { userId },
                    {
                        restaurantId,
                        $or: [
                            { targetRole: null },
                            { targetRole: { $size: 0 } },
                            { targetRole: { $in: ['RestaurantAdmin', 'Admin'] } }
                        ]
                    }
                ]
            };
        } else if (role === 'Customer') {
            query = {
                $or: [
                    { userId },
                    {
                        restaurantId,
                        $or: [
                            { targetRole: null },
                            { targetRole: { $size: 0 } },
                            { targetRole: { $in: ['Customer'] } }
                        ]
                    }
                ]
            };
        } else {
            // Other staff (Chef, Waiter, Cashier, Kitchen, Delivery)
            query = {
                $or: [
                    { userId },
                    {
                        restaurantId,
                        $or: [
                            { targetRole: null },
                            { targetRole: { $size: 0 } },
                            { targetRole: { $in: [role, 'Kitchen'] } }
                        ]
                    }
                ]
            };
        }

        const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(100);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a broadcast notification
// @route   POST /api/notifications/broadcast
// @access  Private
export const createBroadcast = async (req, res) => {
    const { title, desc } = req.body;

    try {
        const notification = await Notification.create({
            title,
            desc,
            type: 'Broadcast',
            restaurantId: req.user.restaurantId,
            read: false
        });

        res.status(201).json(notification);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Create a restock request notification from Kitchen to Admin/Manager
// @route   POST /api/notifications/restock
// @access  Private
export const requestRestock = async (req, res) => {
    const { ingredientNeeded, quantity, unit, urgency, notes } = req.body;

    if (!ingredientNeeded || !String(ingredientNeeded).trim()) {
        return res.status(400).json({ message: 'Ingredient name is required' });
    }

    try {
        const restaurantId = await resolveUserRestaurantId(req.user);
        const branchId = req.user.branchId || req.body.branchId || null;
        const cleanItem = String(ingredientNeeded).trim();
        const qtyNum = Number(quantity) || 0;
        const unitStr = unit ? String(unit).trim() : 'kg';
        const qtyPart = qtyNum > 0 ? `Qty needed: ${qtyNum} ${unitStr}. ` : '';
        const senderLabel = req.user.name ? `Requested by ${req.user.name}. ` : '';

        const title = urgency === 'Urgent'
            ? `URGENT LOW STOCK: ${cleanItem}`
            : `Low Stock Request: ${cleanItem}`;
        const type = urgency === 'Urgent' ? 'Alert' : 'Info';
        const desc = `${qtyPart}${senderLabel}Notes: ${notes || 'Running low in kitchen'}`;

        const notification = await Notification.create({
            title,
            desc,
            type,
            restaurantId,
            branchId,
            userId: req.user._id,
            targetRole: ['RestaurantAdmin', 'Admin', 'BranchManager', 'Chef', 'Kitchen'],
            metadata: {
                kind: 'kitchen_low_stock',
                ingredientName: cleanItem,
                quantity: qtyNum,
                unit: unitStr,
                urgency: urgency || 'Urgent',
                notes: notes || '',
                requestedBy: req.user.name || 'Chef',
                requestedById: req.user._id,
                orderStatus: 'Pending'
            },
            read: false
        });

        if (restaurantId) {
            broadcastToRestaurant(restaurantId, 'new_notification', notification);
        }

        res.status(201).json(notification);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Admin/Manager orders restock item from a Kitchen notification and notifies Kitchen
// @route   POST /api/notifications/:id/order-restock
// @access  Private (RestaurantAdmin, BranchManager)
export const orderRestockFromNotification = async (req, res) => {
    try {
        const restaurantId = await resolveUserRestaurantId(req.user);
        const sourceNote = await Notification.findById(req.params.id);

        if (!sourceNote) {
            return res.status(404).json({ message: 'Restock notification not found' });
        }
        if (
            restaurantId &&
            sourceNote.restaurantId &&
            String(sourceNote.restaurantId) !== String(restaurantId) &&
            req.user.role !== 'SuperAdmin'
        ) {
            return res.status(403).json({ message: 'Not authorized for this restaurant notification' });
        }

        const {
            ingredientName,
            orderQuantity,
            unit,
            supplierId,
            supplierName,
            unitCost,
            expectedDelivery,
            addToStockNow,
            poNotes
        } = req.body;

        const parsedItem = (
            ingredientName ||
            sourceNote.metadata?.ingredientName ||
            sourceNote.title.replace(/^(URGENT LOW STOCK:|URGENT RESTOCK:|Low Stock \/ Restock Request:|Low Stock Request:|Restock Request:|Low Stock Alert:)\s*/i, '')
        ).trim();

        const qty = Math.max(0.1, Number(orderQuantity) || Number(sourceNote.metadata?.quantity) || 5);
        const itemUnit = (unit || sourceNote.metadata?.unit || 'kg').trim();
        const price = Math.max(0, Number(unitCost) || 0);
        const shouldRestockNow = addToStockNow !== false;

        let targetBranchId = sourceNote.branchId || req.user.branchId;
        if (!targetBranchId && restaurantId) {
            const firstBranch = await Branch.findOne({ restaurantId }).select('_id');
            if (firstBranch) targetBranchId = firstBranch._id;
        }

        let resolvedSupplierName = supplierName ? String(supplierName).trim() : '';
        let resolvedSupplierPhone = '';
        let resolvedSupplierId = undefined;
        if (supplierId) {
            const suppDoc = await Supplier.findById(supplierId).select('name phone');
            if (suppDoc) {
                resolvedSupplierId = suppDoc._id;
                resolvedSupplierName = suppDoc.name;
                resolvedSupplierPhone = suppDoc.phone || '';
            }
        }
        if (!resolvedSupplierName) {
            resolvedSupplierName = 'Direct Supplier Order';
        }

        const totalCost = Math.round(qty * price * 100) / 100;
        const invoiceNumber = `PO-${Date.now().toString().slice(-6)}`;

        // 1. Create MaterialPurchase record and update Inventory + StockMovement when branch exists
        if (targetBranchId) {
            let invItem = await Inventory.findOne({
                itemName: { $regex: new RegExp(`^${parsedItem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                branch: targetBranchId
            });

            if (shouldRestockNow) {
                if (invItem) {
                    const prevQty = invItem.quantity || 0;
                    const newQty = prevQty + qty;
                    if (price > 0 && newQty > 0) {
                        const prevPrice = invItem.pricePerUnit || 0;
                        invItem.pricePerUnit = Math.round((((prevQty * prevPrice) + (qty * price)) / newQty) * 100) / 100;
                        invItem.lastPurchasePrice = price;
                    }
                    invItem.quantity = newQty;
                    invItem.lastPurchaseDate = new Date();
                    if (resolvedSupplierId) invItem.supplier = resolvedSupplierId;
                    await invItem.save();

                    await StockMovement.create({
                        restaurantId: sourceNote.restaurantId || restaurantId,
                        branchId: targetBranchId,
                        inventoryItem: invItem._id,
                        itemName: invItem.itemName,
                        movementType: 'Purchase Received',
                        quantityChanged: qty,
                        previousQuantity: prevQty,
                        newQuantity: newQty,
                        unit: invItem.unit || itemUnit,
                        unitCost: price,
                        totalValue: totalCost,
                        reference: `Kitchen Restock #${invoiceNumber}`,
                        reason: `Ordered by ${req.user.name || 'Admin'} for kitchen request`,
                        performedBy: req.user._id,
                        date: new Date()
                    });
                } else {
                    invItem = await Inventory.create({
                        restaurantId: sourceNote.restaurantId || restaurantId,
                        branch: targetBranchId,
                        supplier: resolvedSupplierId,
                        itemName: parsedItem,
                        category: 'Other',
                        quantity: qty,
                        unit: itemUnit,
                        minStockLevel: 5,
                        pricePerUnit: price,
                        lastPurchasePrice: price,
                        lastPurchaseDate: new Date(),
                        costingMethod: 'Weighted Average'
                    });

                    await StockMovement.create({
                        restaurantId: sourceNote.restaurantId || restaurantId,
                        branchId: targetBranchId,
                        inventoryItem: invItem._id,
                        itemName: invItem.itemName,
                        movementType: 'Purchase Received',
                        quantityChanged: qty,
                        previousQuantity: 0,
                        newQuantity: qty,
                        unit: itemUnit,
                        unitCost: price,
                        totalValue: totalCost,
                        reference: `Kitchen Restock #${invoiceNumber}`,
                        reason: `Ordered by ${req.user.name || 'Admin'} for kitchen request`,
                        performedBy: req.user._id,
                        date: new Date()
                    });
                }
            }

            await MaterialPurchase.create({
                restaurantId: sourceNote.restaurantId || restaurantId,
                branchId: targetBranchId,
                supplier: resolvedSupplierId,
                supplierName: resolvedSupplierName,
                supplierPhone: resolvedSupplierPhone,
                invoiceNumber,
                purchaseDate: new Date(),
                items: [{
                    material: invItem?._id,
                    itemName: parsedItem,
                    category: invItem?.category || 'General',
                    quantity: qty,
                    unit: itemUnit,
                    unitPrice: price,
                    taxPercent: 0,
                    taxAmount: 0,
                    totalCost
                }],
                subtotal: totalCost,
                taxAmount: 0,
                totalAmount: totalCost,
                paidAmount: totalCost > 0 ? totalCost : 0,
                balanceDue: 0,
                paymentStatus: totalCost > 0 ? 'Paid' : 'Pending',
                notes: poNotes || `Kitchen low-stock order (${expectedDelivery || 'Today'})`,
                createdBy: req.user._id
            }).catch((err) => {
                console.error('MaterialPurchase log error during restock:', err.message);
            });
        }

        // 2. Update the original Kitchen->Admin notification
        sourceNote.read = true;
        sourceNote.metadata = {
            ...(sourceNote.metadata || {}),
            kind: sourceNote.metadata?.kind || 'kitchen_low_stock',
            ingredientName: parsedItem,
            orderStatus: 'Ordered',
            orderedQty: qty,
            orderedUnit: itemUnit,
            supplierName: resolvedSupplierName,
            unitCost: price,
            invoiceNumber,
            expectedDelivery: expectedDelivery || 'Today',
            addedToStock: shouldRestockNow,
            poNotes: poNotes || '',
            actionedByName: req.user.name || 'Admin',
            actionedAt: new Date().toISOString()
        };
        sourceNote.markModified('metadata');
        await sourceNote.save();

        // 3. Send a dedicated reply Notification back to the Kitchen/Chef side
        const etaPart = expectedDelivery ? ` ETA: ${expectedDelivery}.` : '';
        const stockPart = shouldRestockNow ? ' Inventory stock updated.' : '';
        const notePart = poNotes ? ` Message from Admin: "${poNotes}"` : '';

        const kitchenNotification = await Notification.create({
            title: `Restock Ordered: ${parsedItem}`,
            desc: `${req.user.name || 'Admin'} ordered ${qty} ${itemUnit} of ${parsedItem} from ${resolvedSupplierName}.${etaPart}${stockPart}${notePart}`,
            type: 'Info',
            restaurantId: sourceNote.restaurantId || restaurantId,
            branchId: targetBranchId,
            targetRole: ['Chef', 'Kitchen'],
            metadata: {
                kind: 'admin_restock_reply',
                relatedNotificationId: sourceNote._id,
                ingredientName: parsedItem,
                orderedQty: qty,
                orderedUnit: itemUnit,
                supplierName: resolvedSupplierName,
                invoiceNumber,
                expectedDelivery: expectedDelivery || 'Today',
                addedToStock: shouldRestockNow,
                poNotes: poNotes || '',
                orderedBy: req.user.name || 'Admin'
            },
            read: false
        });

        const wsRestId = sourceNote.restaurantId || restaurantId;
        if (wsRestId) {
            broadcastToRestaurant(wsRestId, 'new_notification', kitchenNotification);
            broadcastToRestaurant(wsRestId, 'restock_ordered', {
                sourceNotification: sourceNote,
                kitchenNotification
            });
        }

        res.json({
            message: 'Item ordered and kitchen notified successfully',
            sourceNotification: sourceNote,
            kitchenNotification
        });
    } catch (error) {
        console.error('Failed to order restock from notification:', error);
        res.status(400).json({ message: error.message || 'Failed to place restock order' });
    }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
    try {
        const query = {
            _id: req.params.id,
            $or: [
                { userId: req.user._id },
                { restaurantId: req.user.restaurantId }
            ]
        };
        let notification = await Notification.findOne(query);
        if (!notification) {
            notification = await Notification.findById(req.params.id);
        }
        if (notification) {
            notification.read = true;
            await notification.save();
            res.json(notification);
        } else {
            res.status(404).json({ message: 'Notification not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
    try {
        const conditions = [];
        if (req.user._id) conditions.push({ userId: req.user._id });
        if (req.user.restaurantId) conditions.push({ restaurantId: req.user.restaurantId });

        const filter = conditions.length > 0 ? { $or: conditions, read: false } : { read: false };
        await Notification.updateMany(filter, { $set: { read: true } });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a single notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || id.startsWith('dummy-')) {
            return res.json({ message: 'Notification removed successfully', id });
        }
        const query = {
            _id: id,
            $or: [
                { userId: req.user._id },
                { restaurantId: req.user.restaurantId }
            ]
        };
        let notification = await Notification.findOne(query);
        if (!notification && req.user.role === 'SuperAdmin') {
            notification = await Notification.findById(id);
        }
        if (notification) {
            await Notification.findByIdAndDelete(notification._id);
            return res.json({ message: 'Notification deleted successfully', id });
        }
        await Notification.findByIdAndDelete(id);
        res.json({ message: 'Notification deleted successfully', id });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Clear all notifications for the current user/restaurant
// @route   DELETE /api/notifications/clear-all
// @access  Private
export const clearAllNotifications = async (req, res) => {
    try {
        const conditions = [];
        if (req.user._id) conditions.push({ userId: req.user._id });
        if (req.user.restaurantId) conditions.push({ restaurantId: req.user.restaurantId });

        const filter = conditions.length > 0 ? { $or: conditions } : {};
        await Notification.deleteMany(filter);
        res.json({ message: 'All notifications cleared successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
