import RestaurantVerification from '../models/RestaurantVerification.js';
import Restaurant from '../models/Restaurant.js';
import Notification from '../models/Notification.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads/verification';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Multer File Filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, JPG, JPEG, PNG, WEBP, and SVG files are allowed'), false);
    }
};

export const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: fileFilter
});

export const verificationUpload = upload.fields([
    { name: 'fssai', maxCount: 1 },
    { name: 'businessRegistration', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'aadhaarCard', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
    { name: 'bankProof', maxCount: 1 },
    { name: 'logo', maxCount: 1 },
    { name: 'images', maxCount: 5 },
    { name: 'menuPdf', maxCount: 1 }
]);

// Helper to construct file URLs (or absolute paths)
const getFileUrl = (file) => {
    return `/uploads/verification/${file.filename}`;
};

// @desc    Submit verification documents
// @route   POST /api/restaurants/verification/submit
// @access  Private/RestaurantAdmin
export const submitVerification = async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId;
        if (!restaurantId) {
            return res.status(404).json({ message: 'No restaurant associated with this user' });
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Get existing verification
        let verification = await RestaurantVerification.findOne({ restaurantId });

        const files = req.files || {};
        const { addressText, fssaiExpiryDate } = req.body;

        // Check mandatory fields across existing documents + newly uploaded files
        const mandatoryFields = ['fssai', 'businessRegistration', 'panCard', 'aadhaarCard', 'addressProof', 'bankProof'];
        const existingDocs = verification?.documents || {};
        const missing = [];
        mandatoryFields.forEach(field => {
            const hasNewFile = files[field] && files[field].length > 0;
            const hasExistingFile = existingDocs[field] && (existingDocs[field].filePath || (field === 'addressProof' && (existingDocs[field].addressText || addressText)));
            if (!hasNewFile && !hasExistingFile) {
                missing.push(field);
            }
        });

        if (missing.length > 0) {
            return res.status(400).json({
                message: `Missing required mandatory documents: ${missing.join(', ')}`
            });
        }

        // Validate FSSAI expiry date if FSSAI is being uploaded
        if (files.fssai || (verification && fssaiExpiryDate)) {
            if (!fssaiExpiryDate) {
                return res.status(400).json({ message: 'FSSAI expiry date is required' });
            }
            const expiry = new Date(fssaiExpiryDate);
            if (isNaN(expiry.getTime()) || expiry < new Date()) {
                return res.status(400).json({ message: 'FSSAI License expiry date must be a valid future date' });
            }
        }

        // Build document updates
        const documents = verification ? { ...verification.documents } : {};

        // Helper to update field
        const updateDocField = (field, expiry = null) => {
            if (files[field]) {
                documents[field] = {
                    filePath: getFileUrl(files[field][0]),
                    status: 'Pending',
                    rejectReason: '',
                    ...(expiry && { expiryDate: new Date(expiry) })
                };
            } else if (verification && verification.documents[field]) {
                // Keep existing, but if it was rejected, check if we provided a new one
                // (if no new file was provided, keep old status/path)
                if (expiry && fssaiExpiryDate) {
                    documents[field].expiryDate = new Date(fssaiExpiryDate);
                }
            }
        };

        updateDocField('fssai', fssaiExpiryDate);
        updateDocField('businessRegistration');
        updateDocField('panCard');
        updateDocField('aadhaarCard');
        updateDocField('bankProof');

        // Address Proof
        if (files.addressProof) {
            documents.addressProof = {
                filePath: getFileUrl(files.addressProof[0]),
                addressText: addressText || documents.addressProof?.addressText || '',
                status: 'Pending',
                rejectReason: ''
            };
        } else if (documents.addressProof) {
            documents.addressProof.addressText = addressText || documents.addressProof.addressText || '';
        } else if (addressText) {
            documents.addressProof = {
                filePath: '',
                addressText,
                status: 'Pending',
                rejectReason: ''
            };
        }

        // Optional Logo (Supports image & PDF converted to Base64)
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

        // Optional Menu PDF
        if (files.menuPdf) {
            documents.menuPdf = { filePath: getFileUrl(files.menuPdf[0]) };
        }

        // Optional Images
        if (files.images) {
            const newImages = files.images.map(img => ({ filePath: getFileUrl(img) }));
            documents.images = [...(documents.images || []), ...newImages];
        }

        if (verification) {
            // Update existing
            verification.documents = documents;
            verification.status = 'Under Review';
            verification.rejectionReason = '';
            
            // Set all individual rejected document statuses back to 'Pending' so Super Admin knows they are re-uploaded
            const fields = ['fssai', 'businessRegistration', 'panCard', 'aadhaarCard', 'addressProof', 'bankProof'];
            fields.forEach(f => {
                if (verification.documents[f] && verification.documents[f].status === 'Rejected') {
                    verification.documents[f].status = 'Pending';
                    verification.documents[f].rejectReason = '';
                }
            });

            await verification.save();
        } else {
            // Create new
            verification = await RestaurantVerification.create({
                restaurantId,
                documents,
                status: 'Under Review'
            });
        }

        // Update restaurant status
        restaurant.verificationStatus = 'Under Review';
        restaurant.approvalStatus = 'Pending';
        await restaurant.save();

        // Notify Super Admins only
        await Notification.create({
            title: 'Verification Under Review',
            desc: `Restaurant "${restaurant.name}" has submitted verification documents for review.`,
            type: 'System',
            isSuperAdminOnly: true
        });

        res.status(200).json(verification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current restaurant verification status
// @route   GET /api/restaurants/verification/mine
// @access  Private/RestaurantAdmin
export const getMyVerification = async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId;
        if (!restaurantId) {
            return res.status(404).json({ message: 'No restaurant associated with this user' });
        }

        const verification = await RestaurantVerification.findOne({ restaurantId }).populate('history.actionBy', 'name email');
        if (!verification) {
            return res.json({ status: 'Pending', documents: {} });
        }

        res.json(verification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all verification requests
// @route   GET /api/restaurants/verification/all
// @access  Private/SuperAdmin
export const getAllVerifications = async (req, res) => {
    try {
        const verifications = await RestaurantVerification.find()
            .populate({
                path: 'restaurantId',
                populate: { path: 'ownerId', select: 'name email' }
            })
            .sort({ updatedAt: -1 });
        res.json(verifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get verification details by ID
// @route   GET /api/restaurants/verification/:id
// @access  Private/SuperAdmin
export const getVerificationById = async (req, res) => {
    try {
        const verification = await RestaurantVerification.findById(req.params.id)
            .populate({
                path: 'restaurantId',
                populate: { path: 'ownerId', select: 'name email' }
            })
            .populate('history.actionBy', 'name email');

        if (!verification) {
            return res.status(404).json({ message: 'Verification record not found' });
        }

        res.json(verification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Review verification documents (Approve/Reject/Re-upload request)
// @route   PUT /api/restaurants/verification/:id/review
// @access  Private/SuperAdmin
export const reviewVerification = async (req, res) => {
    try {
        const { status, rejectionReason, documentStatus } = req.body;
        
        if (!['Verified', 'Rejected', 'Re-upload Required'].includes(status)) {
            return res.status(400).json({ message: 'Invalid review status value' });
        }

        if (status === 'Rejected' && !rejectionReason) {
            return res.status(400).json({ message: 'Rejection reason is mandatory when status is Rejected' });
        }

        const verification = await RestaurantVerification.findById(req.params.id);
        if (!verification) {
            return res.status(404).json({ message: 'Verification record not found' });
        }

        const restaurant = await Restaurant.findById(verification.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Associated restaurant not found' });
        }

        // Apply document-level status overrides if provided (for Re-upload Required)
        if (documentStatus) {
            Object.keys(documentStatus).forEach(key => {
                if (verification.documents[key]) {
                    verification.documents[key].status = documentStatus[key].status || verification.documents[key].status;
                    verification.documents[key].rejectReason = documentStatus[key].rejectReason || '';
                }
            });
        }

        // Set status and history
        verification.status = status;
        verification.rejectionReason = status === 'Rejected' ? rejectionReason : '';
        
        // Log action in history
        verification.history.push({
            status,
            actionBy: req.user._id,
            reason: rejectionReason || '',
            comments: status === 'Verified' ? 'Verification successfully completed.' : 'Review processed.'
        });

        // Set restaurant statuses and subscription hooks
        restaurant.verificationStatus = status;

        if (status === 'Verified') {
            restaurant.approvalStatus = 'Approved';
            
            // Activate subscription: set status to Active and calculate expiryDate
            const billingCycle = restaurant.subscription?.billingCycle || 'monthly';
            const expiry = new Date();
            if (billingCycle === 'yearly') {
                expiry.setDate(expiry.getDate() + 365);
            } else {
                expiry.setDate(expiry.getDate() + 30);
            }

            restaurant.subscription.status = 'Active';
            restaurant.subscription.expiryDate = expiry;

            // Direct individual document overrides to Approved
            const fields = ['fssai', 'businessRegistration', 'panCard', 'aadhaarCard', 'addressProof', 'bankProof'];
            fields.forEach(f => {
                if (verification.documents[f]) {
                    verification.documents[f].status = 'Approved';
                    verification.documents[f].rejectReason = '';
                }
            });

            // Create notification for restaurant owner only
            await Notification.create({
                title: 'Verification Approved',
                desc: `Congratulations! Your restaurant verification has been approved. Your plan "${restaurant.subscription.plan}" is now active until ${expiry.toLocaleDateString()}.`,
                type: 'Alert',
                restaurantId: restaurant._id,
                targetRole: ['RestaurantAdmin', 'Admin']
            });
        } else if (status === 'Rejected') {
            restaurant.approvalStatus = 'Rejected';
            restaurant.subscription.status = 'Inactive';

            // Mark all individual documents as rejected
            const fields = ['fssai', 'businessRegistration', 'panCard', 'aadhaarCard', 'addressProof', 'bankProof'];
            fields.forEach(f => {
                if (verification.documents[f]) {
                    verification.documents[f].status = 'Rejected';
                    verification.documents[f].rejectReason = rejectionReason;
                }
            });

            // Create notification
            await Notification.create({
                title: 'Verification Rejected',
                desc: `Your restaurant verification was rejected. Reason: ${rejectionReason}. Please correct the issues and try again.`,
                type: 'Alert',
                restaurantId: restaurant._id,
                targetRole: ['RestaurantAdmin', 'Admin']
            });
        } else if (status === 'Re-upload Required') {
            restaurant.approvalStatus = 'Pending';
            restaurant.subscription.status = 'Inactive';

            // Create notification
            await Notification.create({
                title: 'Re-upload Documents Required',
                desc: `Verification review: Some documents require correction and re-uploading. Please check the verification panel for details.`,
                type: 'Alert',
                restaurantId: restaurant._id,
                targetRole: ['RestaurantAdmin', 'Admin']
            });
        }

        await verification.save();
        await restaurant.save();

        res.json({ verification, restaurant });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteVerification = async (req, res) => {
    try {
        const verification = await RestaurantVerification.findById(req.params.id);
        if (!verification) {
            return res.status(404).json({ message: 'Verification record not found' });
        }
        await RestaurantVerification.findByIdAndDelete(req.params.id);
        res.json({ message: 'Verification record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
