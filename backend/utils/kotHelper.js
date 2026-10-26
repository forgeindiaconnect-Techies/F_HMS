import KOT from '../models/KOT.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import { broadcastToRestaurant } from '../config/websocket.js';

/**
 * Intelligent Station Routing
 * Routes menu items to the appropriate prep station based on product configuration,
 * category, or item name keywords.
 */
export const determineKitchenStation = (item, menuItem = null) => {
    // 1. Explicit station set on item or product
    if (item.kitchenStation && item.kitchenStation.trim() !== '') {
        return item.kitchenStation.trim();
    }
    if (menuItem && menuItem.kitchenStation && menuItem.kitchenStation.trim() !== '') {
        return menuItem.kitchenStation.trim();
    }

    // 2. Keyword & Category heuristics
    const text = `${item.name || ''} ${item.category || (menuItem?.category || '')} ${(item.notes || '')}`.toLowerCase();

    // Beverages
    if (/beverage|drink|juice|shake|smoothie|tea|coffee|soda|cola|beer|cocktail|mocktail|wine|water|cold drink|lassi|mojito|bar/i.test(text)) {
        return 'Beverages';
    }

    // Desserts
    if (/dessert|ice cream|icecream|cake|pastry|pudding|sweet|brownie|waffle|halwa|gulab jamun|kheer|tiramisu|sundae|custard/i.test(text)) {
        return 'Desserts';
    }

    // Pizza / Oven
    if (/pizza|calzone|garlic bread|pasta|lasagna|lasagne|oven|bake|gratin|flatbread/i.test(text)) {
        return 'Pizza / Oven';
    }

    // Cold / Salad / Starters
    if (/salad|cold bar|raita|soup|chaat|curd|appetizer/i.test(text)) {
        return 'Cold / Salad';
    }

    // Default Station
    return 'Main Kitchen';
};

/**
 * Generate Next Sequential KOT Number
 * Guarantees a clean, sequential, human-readable KOT number per restaurant
 * e.g. KOT-1001, KOT-1002, KOT-1003
 */
export const getNextKotNumber = async (restaurantId, branchId) => {
    try {
        const lastKot = await KOT.findOne({ restaurantId }).sort({ createdAt: -1 });
        let nextSeq = 1001;
        if (lastKot && typeof lastKot.kotSequence === 'number' && !isNaN(lastKot.kotSequence)) {
            nextSeq = lastKot.kotSequence + 1;
        } else if (lastKot && lastKot.kotNumber) {
            const match = String(lastKot.kotNumber).match(/\d+/);
            if (match) {
                nextSeq = parseInt(match[0], 10) + 1;
            }
        }
        return {
            kotNumber: `KOT-${nextSeq}`,
            kotSequence: nextSeq
        };
    } catch (err) {
        const fallbackSeq = Date.now() % 100000;
        return {
            kotNumber: `KOT-${fallbackSeq}`,
            kotSequence: fallbackSeq
        };
    }
};

/**
 * Generate KOTs for an Order
 * - Groups items by kitchen station (Feature 5)
 * - Creates a distinct KOT for each station
 * - Supports Running / Add-on KOTs (Feature 1)
 * - Broadcasts real-time WebSocket alerts (Feature 3)
 */
export const generateKOTsForOrder = async (order, options = {}) => {
    if (!order) return [];

    // Check if KOT system is enabled for this restaurant
    try {
        const Restaurant = (await import('../models/Restaurant.js')).default;
        const targetRest = await Restaurant.findById(order.restaurantId).select('restaurantConfig');
        if (targetRest?.restaurantConfig?.orderKitchen?.kotEnabled === false) {
            return [];
        }
    } catch (e) {
        console.error('Error checking kotEnabled config:', e);
    }

    const itemsToProcess = options.items || order.orderItems || [];
    if (!itemsToProcess || itemsToProcess.length === 0) return [];

    const isAddon = Boolean(options.isAddon);
    const serverName = options.serverName || (options.user?.name) || (order.customerName ? `Guest (${order.customerName})` : 'System POS');
    const orderNumber = options.orderNumber || `#${String(order._id).slice(-5).toUpperCase()}`;

    // Collect product details for accurate station routing
    const productIds = itemsToProcess
        .map(i => i.product)
        .filter(p => p && String(p).match(/^[0-9a-fA-F]{24}$/));

    let menuItemsMap = new Map();
    if (productIds.length > 0) {
        try {
            const menuItems = await MenuItem.find({ _id: { $in: productIds } }).select('name category kitchenStation');
            menuItems.forEach(m => menuItemsMap.set(String(m._id), m));
        } catch (e) {
            console.error('Error fetching menu items for KOT station routing', e);
        }
    }

    // Group items by Kitchen Station
    const stationGroups = new Map();
    itemsToProcess.forEach(item => {
        const menuItem = item.product ? menuItemsMap.get(String(item.product)) : null;
        const station = determineKitchenStation(item, menuItem);

        if (!stationGroups.has(station)) {
            stationGroups.set(station, []);
        }
        stationGroups.get(station).push({
            name: item.name,
            qty: item.qty || 1,
            price: item.price || 0,
            notes: item.notes || item.specialInstructions || '',
            product: item.product || null,
            kitchenStation: station,
            status: 'Pending'
        });
    });

    const createdKOTs = [];

    for (const [station, stationItems] of stationGroups.entries()) {
        const { kotNumber, kotSequence } = await getNextKotNumber(order.restaurantId, order.branchId);

        const kot = new KOT({
            kotNumber,
            kotSequence,
            orderId: order._id,
            orderNumber,
            restaurantId: order.restaurantId,
            branchId: order.branchId,
            tableNumber: order.tableNumber || '',
            orderType: order.orderType || 'Dine In',
            serviceType: order.serviceType || 'Waiter Table Service',
            customerName: order.customerName || '',
            customerPhone: order.customerPhone || '',
            kitchenStation: station,
            items: stationItems,
            notes: isAddon 
                ? (options.notes ? `[Add-on Item] ${options.notes}` : `[Add-on Item] Additional order placed for Table ${order.tableNumber || ''}`)
                : (order.notes || options.notes || ''),
            isAddon,
            status: 'Pending',
            statusHistory: [{
                status: 'Pending',
                timestamp: new Date(),
                updatedBy: options.user?._id || null
            }],
            serverName,
            createdBy: options.user?._id || null
        });

        const savedKOT = await kot.save();
        createdKOTs.push(savedKOT);

        // Realtime notification broadcast to kitchen displays and staff
        broadcastToRestaurant(order.restaurantId, 'new_kot', savedKOT);
    }

    // Append created KOT IDs to parent Order
    try {
        const kotIds = createdKOTs.map(k => k._id);
        const kotNums = createdKOTs.map(k => k.kotNumber);
        await Order.findByIdAndUpdate(order._id, {
            $addToSet: {
                kots: { $each: kotIds },
                kotNumbers: { $each: kotNums }
            }
        });
    } catch (orderUpdateErr) {
        console.error('Error linking KOTs to Order', orderUpdateErr);
    }

    return createdKOTs;
};

/**
 * Validate KOT Status Transitions
 * Prevents invalid workflows (e.g., cannot complete before ready, cannot revert from served)
 */
export const validateKOTStatusTransition = (currentStatus, newStatus) => {
    if (currentStatus === newStatus) return { valid: true };

    const allowedTransitions = {
        'Pending': ['Preparing', 'Cancelled'],
        'Preparing': ['Ready', 'Cancelled'],
        'Ready': ['Served', 'Cancelled'],
        'Served': [], // Terminal state
        'Cancelled': [] // Terminal state
    };

    const allowedNext = allowedTransitions[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
        return {
            valid: false,
            message: `Invalid KOT status transition: cannot change from "${currentStatus}" to "${newStatus}". Allowed next: ${allowedNext.join(', ') || 'None (Terminal state)'}.`
        };
    }

    return { valid: true };
};
