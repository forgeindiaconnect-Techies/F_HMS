import Notification from '../models/Notification.js';

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

// @desc    Create a restock request notification
// @route   POST /api/notifications/restock
// @access  Private
export const requestRestock = async (req, res) => {
    const { ingredientNeeded, urgency, notes } = req.body;

    try {
        const title = urgency === 'Urgent' ? `URGENT RESTOCK: ${ingredientNeeded}` : `Restock Request: ${ingredientNeeded}`;
        const type = urgency === 'Urgent' ? 'Alert' : 'Info';
        const desc = `Kitchen requests restock. Notes: ${notes || 'None'}`;

        const notification = await Notification.create({
            title,
            desc,
            type,
            restaurantId: req.user.restaurantId,
            read: false
        });

        res.status(201).json(notification);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
        
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
        await Notification.updateMany(
            { restaurantId: req.user.restaurantId, read: false },
            { $set: { read: true } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
