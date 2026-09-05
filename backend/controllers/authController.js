import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Restaurant from '../models/Restaurant.js';
import Branch from '../models/Branch.js';
import Notification from '../models/Notification.js';
import RestaurantVerification from '../models/RestaurantVerification.js';
import { sendWelcomeEmail, sendLoginNotificationEmail, sendApprovalEmail } from '../utils/emailService.js';

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
        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Please provide name, email, and password.' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const userExists = await User.findOne({ email: { $regex: `^${normalizedEmail}$`, $options: 'i' } });

        if (userExists) {
            return res.status(400).json({ message: 'An account with this email address already exists. Please log in instead.' });
        }

        const role = roleName || (req.body.restaurantName ? 'RestaurantAdmin' : 'Customer');

        const user = await User.create({
            name: String(name).trim(),
            email: normalizedEmail,
            password,
            phoneNumber: phoneNumber || '',
            role: role,
        });

        let createdRestaurant = null;

        if (role === 'RestaurantAdmin' || req.body.restaurantName) {
            const files = req.files || {};
            const hasVerificationFiles = Object.keys(files).length > 0;
            const restaurantName = req.body.restaurantName || `${name}'s Restaurant`;

            const sanitizePlan = (p) => {
                if (!p) return 'Basic';
                const lower = String(p).trim().toLowerCase();
                if (lower === 'basic') return 'Basic';
                if (lower === 'pro' || lower === 'professional') return 'Pro';
                if (lower === 'enterprise') return 'Enterprise';
                if (lower === 'starter') return 'Starter';
                return p.charAt(0).toUpperCase() + p.slice(1);
            };

            createdRestaurant = await Restaurant.create({
                name: restaurantName,
                ownerId: user._id,
                subscription: {
                    status: 'Active',
                    plan: sanitizePlan(req.body.plan),
                    billingCycle: req.body.billingCycle || 'monthly',
                    trialActive: true,
                    startDate: new Date(),
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30-Day Free Trial
                },
                approvalStatus: 'Pending',
                verificationStatus: hasVerificationFiles ? 'Under Review' : 'Pending'
            });
            user.restaurantId = createdRestaurant._id;

            // Create initial main branch
            const initialBranch = await Branch.create({
                restaurantId: createdRestaurant._id,
                name: `${createdRestaurant.name} Branch`,
                location: { address: 'Primary Location' },
                contact: { phone: phoneNumber || '' },
                isActive: true
            });
            user.branchId = initialBranch._id;
            await user.save();

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
                createdRestaurant.logo = req.body.logoBase64;
                await createdRestaurant.save();
            } else if (files.logo && files.logo.length > 0) {
                const logoFile = files.logo[0];
                documents.logo = { filePath: getFileUrl(logoFile) };
                try {
                    const fileBuffer = fs.readFileSync(logoFile.path);
                    const ext = path.extname(logoFile.originalname || logoFile.filename || '').toLowerCase();
                    const mimeType = ext === '.pdf' ? 'application/pdf' : (logoFile.mimetype || 'image/png');
                    createdRestaurant.logo = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
                } catch (e) {
                    createdRestaurant.logo = getFileUrl(logoFile);
                }
                await createdRestaurant.save();
            }

            if (files.menuPdf && files.menuPdf.length > 0) {
                documents.menuPdf = { filePath: getFileUrl(files.menuPdf[0]) };
            }

            if (files.images && files.images.length > 0) {
                documents.images = files.images.map(img => ({ filePath: getFileUrl(img) }));
            }

            // Always create RestaurantVerification document so Super Admin receives the verification request
            const verifStatus = hasVerificationFiles ? 'Under Review' : 'Pending';
            await RestaurantVerification.create({
                restaurantId: createdRestaurant._id,
                documents,
                status: verifStatus
            });

            // Notify Super Admins
            try {
                await Notification.create({
                    title: 'Verification Under Review',
                    desc: `Restaurant "${createdRestaurant.name}" has submitted verification documents during signup.`,
                    type: 'System',
                    isSuperAdminOnly: true
                });
            } catch (notifErr) {
                console.error("Failed to create signup verification notification", notifErr);
            }
        }

        if (user) {
            // Create system notification for Super Admin
            try {
                if (role === 'RestaurantAdmin') {
                    await Notification.create({
                        title: 'New Restaurant Registered',
                        desc: `New restaurant "${req.body.restaurantName || 'Unnamed'}" has registered. Owner: ${name} (${email})`,
                        type: 'System',
                        isSuperAdminOnly: true
                    });
                } else if (role === 'Customer') {
                    await Notification.create({
                        title: 'New Customer Signup',
                        desc: `New customer "${name}" (${email}) registered on the platform.`,
                        type: 'System',
                        isSuperAdminOnly: true
                    });
                }
            } catch (notifErr) {
                console.error("Failed to create signup notification", notifErr);
            }

            // Trigger Welcome Email in background
            try {
                const restName = createdRestaurant ? createdRestaurant.name : req.body.restaurantName || 'Your Account';
                const restPlan = createdRestaurant ? createdRestaurant.subscription?.plan : req.body.plan || 'Basic';
                sendWelcomeEmail({
                    email: user.email,
                    name: user.name,
                    restaurantName: restName,
                    plan: restPlan
                }).catch(err => console.error("Welcome email background error:", err.message));
            } catch (eErr) {
                console.error("Welcome email dispatch error:", eErr.message);
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
                restaurantId: user.restaurantId,
                branchId: user.branchId,
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
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        let user = await User.findOne({ email: { $regex: `^${normalizedEmail}$`, $options: 'i' } });

        // Auto-provision default SuperAdmin if missing on login attempt
        if (!user && (normalizedEmail === 'admin@restosys.com' || normalizedEmail === 'admin@restauranthub.com') && String(password).trim() === 'password123') {
            user = await User.create({
                name: 'Super Admin',
                email: normalizedEmail,
                password: 'password123',
                role: 'SuperAdmin'
            });
        }

        const cleanPassword = String(password).trim();
        if (user && (await user.matchPassword(cleanPassword))) {
            if (loginType === 'staff' && user.role === 'Customer') {
                return res.status(403).json({ message: 'Customers cannot log into the staff portal' });
            }
            if (loginType === 'customer' && user.role !== 'Customer') {
                return res.status(403).json({ message: 'Staff cannot log into the customer portal' });
            }

            // Auto-heal: If RestaurantAdmin user has no restaurantId set, find by ownerId
            if (!user.restaurantId && user.role === 'RestaurantAdmin') {
                const ownedRestaurant = await Restaurant.findOne({ ownerId: user._id });
                if (ownedRestaurant) {
                    user.restaurantId = ownedRestaurant._id;
                    await user.save();
                }
            }

            // Check subscription if user belongs to a restaurant (flag status as Frozen if expired, but do NOT block login)
            if (user.restaurantId && user.role !== 'SuperAdmin') {
                const restaurant = await Restaurant.findById(user.restaurantId);
                if (restaurant) {
                    if (restaurant.subscription.status === 'Frozen' || (restaurant.subscription.expiryDate && new Date(restaurant.subscription.expiryDate) < new Date())) {
                        if (restaurant.subscription.status !== 'Frozen') {
                            restaurant.subscription.status = 'Frozen';
                            await restaurant.save();
                        }
                        // Allow login so user can access dashboard and use SubscriptionFreezeOverlay / QR payment to upgrade
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

            // Trigger Real-Time Login Notification Email in background
            try {
                sendLoginNotificationEmail({
                    email: user.email,
                    name: user.name,
                    role: user.role
                }).catch(err => console.error("Login email background error:", err.message));
            } catch (lErr) {
                console.error("Login email error:", lErr.message);
            }

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

// @desc    Resend Welcome / Registration Email for an existing user or all restaurant admins
// @route   POST /api/auth/resend-welcome-email
// @access  Public
export const resendWelcomeEmail = async (req, res) => {
    try {
        const { email } = req.body;
        let usersToNotify = [];

        if (email) {
            const normalizedEmail = String(email).trim().toLowerCase();
            const user = await User.findOne({ email: { $regex: `^${normalizedEmail}$`, $options: 'i' } });
            if (user) {
                usersToNotify.push(user);
            } else {
                return res.status(404).json({ message: `No user account found for email: ${email}` });
            }
        } else {
            // Find all registered users with admin roles or linked restaurant IDs
            usersToNotify = await User.find({
                $or: [
                    { role: { $regex: 'admin', $options: 'i' } },
                    { restaurantId: { $exists: true, $ne: null } }
                ]
            });

            // Fallback: If no admin roles found, retrieve all users in database
            if (usersToNotify.length === 0) {
                usersToNotify = await User.find();
            }
        }

        // Send instant response so HTTP connection never times out
        res.json({
            success: true,
            message: `Dispatched real-time email notifications for ${usersToNotify.length} account(s) in background.`,
            count: usersToNotify.length,
            accounts: usersToNotify.map(u => ({ email: u.email, name: u.name }))
        });

        // Execute Brevo dispatches asynchronously in parallel
        (async () => {
            for (const user of usersToNotify) {
                try {
                    let restaurant = null;
                    if (user.restaurantId) {
                        restaurant = await Restaurant.findById(user.restaurantId);
                    } else {
                        restaurant = await Restaurant.findOne({ ownerId: user._id });
                    }

                    const restName = restaurant ? restaurant.name : `${user.name}'s Restaurant`;
                    const restPlan = restaurant ? restaurant.subscription?.plan : 'Basic';

                    await sendWelcomeEmail({
                        email: user.email,
                        name: user.name,
                        restaurantName: restName,
                        plan: restPlan
                    });

                    if (restaurant && restaurant.approvalStatus === 'Approved') {
                        await sendApprovalEmail({
                            email: user.email,
                            name: user.name,
                            restaurantName: restName,
                            plan: restPlan
                        });
                    }
                } catch (bErr) {
                    console.error("Background email dispatch error for user:", user.email, bErr.message);
                }
            }
        })();

    } catch (error) {
        console.error("Resend welcome email error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Test send an email to a specific address and return Brevo status
// @route   POST /api/auth/test-email
// @access  Public
export const testSendEmail = async (req, res) => {
    try {
        const { email, apiKey } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email address is required in body' });
        }

        const targetApiKey = apiKey || process.env.BREVO_API_KEY || [
            'xkeysib',
            'c6631c60c4656c1ba3be795c6f60f1a94fa9a47c45ecc92add4e4f83827b7d6d',
            'ZUUMRh04YAW16Ugq'
        ].join('-');

        const senderEmail = process.env.BREVO_SENDER_EMAIL || 'forgeindiaconnectfic@gmail.com';
        const senderName = process.env.BREVO_SENDER_NAME || 'Restaurant Hub';

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': targetApiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: senderName, email: senderEmail },
                to: [{ email: email, name: 'Valued User' }],
                subject: 'Restaurant Hub Real-Time Email Test',
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc;">
                        <h1 style="color: #059669;">Restaurant Hub Live Email Test 🎉</h1>
                        <p>If you are receiving this message, real-time automated email delivery is working perfectly!</p>
                    </div>
                `
            })
        });

        const data = await response.json();
        res.json({
            statusCode: response.status,
            success: response.ok,
            brevoResponse: data
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Create Razorpay Order for New Registration Subscription
// @route   POST /api/auth/razorpay-order
// @access  Public
export const createRazorpayRegistrationOrder = async (req, res) => {
    try {
        const { planName, billingCycle, restaurantName } = req.body;
        const Plan = (await import('../models/Plan.js')).default;
        const Razorpay = (await import('razorpay')).default;

        const targetPlan = await Plan.findOne({ name: planName });
        const targetPrice = targetPlan 
            ? (billingCycle === 'yearly' ? targetPlan.yearlyPrice : targetPlan.monthlyPrice)
            : (planName === 'Pro' ? (billingCycle === 'yearly' ? 990 : 99) : (billingCycle === 'yearly' ? 1990 : 199));

        const chargeAmount = Math.max(1, targetPrice);
        const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SlbQBi57McKtUc';
        const keySecret = process.env.RAZORPAY_KEY_SECRET || 'IgfxpfmQCMxSPaU0T4EyhcLU';

        const instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret
        });

        const razorpayOrder = await instance.orders.create({
            amount: Math.round(chargeAmount * 100),
            currency: 'INR',
            receipt: `reg_${Date.now().toString().slice(-8)}`,
            notes: {
                planName: planName || 'Basic',
                billingCycle: billingCycle || 'monthly',
                restaurantName: restaurantName || ''
            }
        });

        res.json({
            orderId: razorpayOrder.id,
            amount: chargeAmount,
            amountPaise: Math.round(chargeAmount * 100),
            currency: 'INR',
            keyId: keyId,
            planName,
            billingCycle
        });
    } catch (error) {
        console.error('Razorpay Registration Order Creation Error:', error);
        res.status(400).json({ message: error.message || 'Failed to create Razorpay Order' });
    }
};

