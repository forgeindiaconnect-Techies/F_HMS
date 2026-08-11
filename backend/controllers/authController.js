import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Restaurant from '../models/Restaurant.js';
import Branch from '../models/Branch.js';
import Notification from '../models/Notification.js';
import RestaurantVerification from '../models/RestaurantVerification.js';

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkey123', {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    const { name, email, password, phoneNumber, roleName, loginType } = req.body;

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
            phoneNumber,
            role: role,
        });

        if (role === 'RestaurantAdmin' && req.body.restaurantName) {
            const files = req.files || {};
            const hasVerificationFiles = Object.keys(files).length > 0;

            const restaurant = await Restaurant.create({
                name: req.body.restaurantName,
                ownerId: user._id,
                subscription: {
                    status: 'Active',
                    plan: req.body.plan || 'Basic',
                    billingCycle: req.body.billingCycle || 'monthly',
                    trialActive: true,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                },
                approvalStatus: 'Pending',
                verificationStatus: hasVerificationFiles ? 'Under Review' : 'Pending'
            });
            user.restaurantId = restaurant._id;

            // Create initial main branch
            const initialBranch = await Branch.create({
                restaurantId: restaurant._id,
                name: `${restaurant.name} Branch`,
                location: { address: 'Primary Location' },
                contact: { phone: phoneNumber || '' },
                isActive: true
            });
            user.branchId = initialBranch._id;
            await user.save();

            if (hasVerificationFiles) {
                const { addressText, fssaiExpiryDate } = req.body;
                const documents = {};
                const getFileUrl = (file) => `/uploads/verification/${file.filename}`;

                const addField = (field, expiry = null) => {
                    if (files[field] && files[field].length > 0) {
                        documents[field] = {
                            filePath: getFileUrl(files[field][0]),
                            status: 'Pending',
                            rejectReason: '',
                            ...(expiry && { expiryDate: new Date(expiry) })
                        };
                    }
                };

                addField('fssai', fssaiExpiryDate);
                addField('businessRegistration');
                addField('panCard');
                addField('aadhaarCard');
                addField('bankProof');

                if (files.addressProof && files.addressProof.length > 0) {
                    documents.addressProof = {
                        filePath: getFileUrl(files.addressProof[0]),
                        addressText: addressText || '',
                        status: 'Pending',
                        rejectReason: ''
                    };
                } else if (addressText) {
                    documents.addressProof = {
                        filePath: '',
                        addressText,
                        status: 'Pending',
                        rejectReason: ''
                    };
                }

                if (req.body.logoBase64) {
                    documents.logo = { filePath: req.body.logoBase64 };
                    restaurant.logo = req.body.logoBase64;
                    await restaurant.save();
                } else if (files.logo && files.logo.length > 0) {
                    const logoFile = files.logo[0];
                    documents.logo = { filePath: getFileUrl(logoFile) };
                    try {
                        const fileBuffer = fs.readFileSync(logoFile.path);
                        const ext = path.extname(logoFile.originalname || logoFile.filename || '').toLowerCase();
                        const mimeType = ext === '.pdf' ? 'application/pdf' : (logoFile.mimetype || 'image/png');
                        restaurant.logo = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
                    } catch (e) {
                        restaurant.logo = getFileUrl(logoFile);
                    }
                    await restaurant.save();
                }

                if (files.menuPdf && files.menuPdf.length > 0) {
                    documents.menuPdf = { filePath: getFileUrl(files.menuPdf[0]) };
                }

                if (files.images && files.images.length > 0) {
                    documents.images = files.images.map(img => ({ filePath: getFileUrl(img) }));
                }

                await RestaurantVerification.create({
                    restaurantId: restaurant._id,
                    documents,
                    status: 'Under Review'
                });

                // Notify Super Admins
                try {
                    await Notification.create({
                        title: 'Verification Under Review',
                        desc: `Restaurant "${restaurant.name}" has submitted verification documents during signup.`,
                        type: 'System'
                    });
                } catch (notifErr) {
                    console.error("Failed to create signup verification notification", notifErr);
                }
            }
        }

        if (user) {
            // Create system notification for Super Admin
            try {
                if (role === 'RestaurantAdmin') {
                    await Notification.create({
                        title: 'New Restaurant Registered',
                        desc: `New restaurant "${req.body.restaurantName || 'Unnamed'}" has registered. Owner: ${name} (${email})`,
                        type: 'System'
                    });
                } else if (role === 'Customer') {
                    await Notification.create({
                        title: 'New Customer Signup',
                        desc: `New customer "${name}" (${email}) registered on the platform.`,
                        type: 'System'
                    });
                }
            } catch (notifErr) {
                console.error("Failed to create signup notification", notifErr);
            }

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
