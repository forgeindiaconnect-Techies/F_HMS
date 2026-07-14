import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Restaurant from '../models/Restaurant.js';

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    const { name, email, password, roleName, loginType } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const role = roleName || 'Customer';

        // Check if customer is trying to register in staff portal or vice versa
        if (loginType === 'staff' && role === 'Customer') {
            return res.status(403).json({ message: 'Cannot register as customer from staff portal' });
        }
        if (loginType === 'customer' && role !== 'Customer') {
            return res.status(403).json({ message: 'Cannot register as staff from customer portal' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role,
        });

        if (role === 'RestaurantAdmin' && req.body.restaurantName) {
            const expiryDate = new Date();
            if (req.body.billingCycle === 'yearly') {
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            } else {
                expiryDate.setMonth(expiryDate.getMonth() + 1);
            }
            
            const restaurant = await Restaurant.create({
                name: req.body.restaurantName,
                ownerId: user._id,
                subscription: {
                    status: 'Active',
                    plan: req.body.plan || 'Basic',
                    billingCycle: req.body.billingCycle || 'monthly',
                    expiryDate: expiryDate
                },
                approvalStatus: 'Approved'
            });
            user.restaurantId = restaurant._id;
            await user.save();
        }

        if (user) {
            const token = generateToken(user._id);
            
            const cookieName = loginType === 'customer' ? 'jwt_customer' : 'jwt_staff';
            res.cookie(cookieName, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development',
                sameSite: 'none',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: token,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    const { email, password, loginType } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            if (loginType === 'staff' && user.role === 'Customer') {
                return res.status(403).json({ message: 'Customers cannot log into the staff portal' });
            }
            if (loginType === 'customer' && user.role !== 'Customer') {
                return res.status(403).json({ message: 'Staff cannot log into the customer portal' });
            }

            // Check subscription if user belongs to a restaurant
            if (user.restaurantId && user.role !== 'SuperAdmin') {
                const restaurant = await Restaurant.findById(user.restaurantId);
                if (restaurant) {
                    if (restaurant.subscription.status === 'Frozen' || (restaurant.subscription.expiryDate && new Date(restaurant.subscription.expiryDate) < new Date())) {
                        if (restaurant.subscription.status !== 'Frozen') {
                            restaurant.subscription.status = 'Frozen';
                            await restaurant.save();
                        }
                        return res.status(403).json({ message: 'Your subscription has expired. Please renew to continue using the platform.' });
                    }
                }
            }

            const token = generateToken(user._id);
            
            // Set cookie (optional, for HttpOnly cookie approach)
            const cookieName = loginType === 'customer' ? 'jwt_customer' : 'jwt_staff';
            res.cookie(cookieName, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
                sameSite: 'none', // Allow cross-site cookies for Vercel/Render
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                restaurantId: user.restaurantId,
                branchId: user.branchId,
                token: token,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = (req, res) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'none',
        expires: new Date(0),
    };
    res.cookie('jwt_staff', '', cookieOptions);
    res.cookie('jwt_customer', '', cookieOptions);
    res.cookie('jwt', '', cookieOptions); // Clear old cookie just in case
    res.status(200).json({ message: 'Logged out successfully' });
};
