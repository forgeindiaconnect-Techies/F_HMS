import Restaurant from '../models/Restaurant.js';
import Branch from '../models/Branch.js';

// @desc    Get all restaurants (SuperAdmin only)
// @route   GET /api/restaurants
// @access  Private/SuperAdmin
export const getRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({}).populate('ownerId', 'name email');
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update restaurant subscription
// @route   PUT /api/restaurants/:id/subscription
// @access  Private/SuperAdmin
export const updateSubscription = async (req, res) => {
    try {
        const { status, plan, billingCycle, addMonths, addYears } = req.body;
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        if (status) restaurant.subscription.status = status;
        if (plan) restaurant.subscription.plan = plan;
        if (billingCycle) restaurant.subscription.billingCycle = billingCycle;
        
        if (addMonths || addYears) {
            let currentExpiry = restaurant.subscription.expiryDate ? new Date(restaurant.subscription.expiryDate) : new Date();
            // If already expired, start from today
            if (currentExpiry < new Date()) {
                currentExpiry = new Date();
            }
            if (addMonths) currentExpiry.setMonth(currentExpiry.getMonth() + addMonths);
            if (addYears) currentExpiry.setFullYear(currentExpiry.getFullYear() + addYears);
            
            restaurant.subscription.expiryDate = currentExpiry;
            
            // Automatically reactivate on renewal if frozen
            if (restaurant.subscription.status === 'Frozen') {
                restaurant.subscription.status = 'Active';
            }
        }

        const updatedRestaurant = await restaurant.save();
        res.json(updatedRestaurant);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Create a restaurant
// @route   POST /api/restaurants
// @access  Private/Admin
export const createRestaurant = async (req, res) => {
    try {
        const { name, currency, taxRate } = req.body;
        const restaurant = await Restaurant.create({ name, currency, taxRate });
        res.status(201).json(restaurant);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get my restaurant
// @route   GET /api/restaurants/mine
// @access  Private
export const getMyRestaurant = async (req, res) => {
    try {
        if (!req.user.restaurantId) {
            return res.status(404).json({ message: 'No restaurant associated with this user' });
        }
        const restaurant = await Restaurant.findById(req.user.restaurantId);
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update my restaurant
// @route   PUT /api/restaurants/mine
// @access  Private
export const updateMyRestaurant = async (req, res) => {
    try {
        if (!req.user.restaurantId) {
            return res.status(404).json({ message: 'No restaurant associated with this user' });
        }
        
        const { name, contactEmail, currency, timezone, features } = req.body;
        
        const restaurant = await Restaurant.findById(req.user.restaurantId);
        if (restaurant) {
            restaurant.name = name || restaurant.name;
            restaurant.contactEmail = contactEmail !== undefined ? contactEmail : restaurant.contactEmail;
            restaurant.currency = currency || restaurant.currency;
            restaurant.timezone = timezone || restaurant.timezone;
            if (features) {
                restaurant.features = {
                    onlineOrdering: features.onlineOrdering !== undefined ? features.onlineOrdering : restaurant.features?.onlineOrdering,
                    tableReservations: features.tableReservations !== undefined ? features.tableReservations : restaurant.features?.tableReservations
                };
            }
            
            const updatedRestaurant = await restaurant.save();
            res.json(updatedRestaurant);
        } else {
            res.status(404).json({ message: 'Restaurant not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get branches for a restaurant
// @route   GET /api/restaurants/:id/branches
// @access  Private
export const getBranches = async (req, res) => {
    try {
        const branches = await Branch.find({ restaurantId: req.params.id }).populate('manager', 'name email');
        res.json(branches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a branch
// @route   POST /api/restaurants/:id/branches
// @access  Private/Admin
export const createBranch = async (req, res) => {
    try {
        const { name, location, contact, manager } = req.body;
        const branch = await Branch.create({
            restaurant: req.params.id,
            name,
            location,
            contact,
            manager
        });
        res.status(201).json(branch);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
