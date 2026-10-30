import Testimonial from '../models/Testimonial.js';
import Restaurant from '../models/Restaurant.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Setup uploads directory for testimonial avatars
const testimonialUploadDir = 'uploads/testimonials';
if (!fs.existsSync(testimonialUploadDir)) {
    fs.mkdirSync(testimonialUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, testimonialUploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'testimonial-' + unique + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Only JPG, JPEG, PNG, or WEBP images are allowed'), false);
};

export const testimonialUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter
}).single('avatar');

// @desc    Get published/approved testimonials for public landing page
// @route   GET /api/testimonials/public
// @access  Public
export const getPublicTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find({ status: 'Approved' })
            .sort({ approvedAt: -1, createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: testimonials.length,
            data: testimonials
        });
    } catch (error) {
        console.error('Error fetching public testimonials:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch testimonials' });
    }
};

// @desc    Get logged-in restaurant owner's testimonial
// @route   GET /api/testimonials/mine
// @access  Private (Restaurant Owner / Admin)
export const getMyTestimonial = async (req, res) => {
    try {
        const userId = req.user._id;
        const testimonial = await Testimonial.findOne({ userId });

        // Also fetch restaurant info to auto-fill defaults
        let restaurantName = '';
        let location = '';
        if (req.user.restaurantId) {
            const restaurant = await Restaurant.findById(req.user.restaurantId).select('name address city state');
            if (restaurant) {
                restaurantName = restaurant.name || '';
                location = restaurant.address || (restaurant.city && restaurant.state ? `${restaurant.city}, ${restaurant.state}` : '');
            }
        }

        res.status(200).json({
            success: true,
            data: testimonial || null,
            defaults: {
                ownerName: req.user.name || '',
                restaurantName,
                location
            }
        });
    } catch (error) {
        console.error('Error fetching owner testimonial:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve testimonial' });
    }
};

// @desc    Create or update logged-in owner's testimonial
// @route   POST /api/testimonials/mine
// @access  Private (Restaurant Owner / Admin)
export const saveMyTestimonial = async (req, res) => {
    try {
        const userId = req.user._id;
        const { ownerName, restaurantName, location, quote, rating } = req.body;

        if (!ownerName || !restaurantName || !location || !quote) {
            return res.status(400).json({
                success: false,
                message: 'Owner name, restaurant name, location, and testimonial text are required.'
            });
        }

        const parsedRating = Number(rating) || 5;
        if (parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5 stars.'
            });
        }

        // Find or verify restaurant ID
        let restaurantId = req.user.restaurantId;
        if (!restaurantId) {
            const ownedRestaurant = await Restaurant.findOne({ ownerId: userId }).select('_id');
            if (ownedRestaurant) {
                restaurantId = ownedRestaurant._id;
            }
        }

        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'No associated restaurant found for your account.'
            });
        }

        let existingTestimonial = await Testimonial.findOne({ userId });

        let avatarUrl = existingTestimonial ? existingTestimonial.avatar : '';
        if (req.body.removeAvatar === 'true' || req.body.removeAvatar === true) {
            avatarUrl = '';
        } else if (req.file) {
            avatarUrl = `/uploads/testimonials/${req.file.filename}`;
        } else if (req.body.avatarUrl !== undefined) {
            avatarUrl = req.body.avatarUrl;
        }

        if (existingTestimonial) {
            // Update existing testimonial - resets to 'Pending' so edits get re-moderated
            existingTestimonial.ownerName = ownerName.trim();
            existingTestimonial.restaurantName = restaurantName.trim();
            existingTestimonial.location = location.trim();
            existingTestimonial.quote = quote.trim();
            existingTestimonial.rating = parsedRating;
            existingTestimonial.avatar = avatarUrl;
            existingTestimonial.status = 'Pending'; // Re-approval required
            existingTestimonial.rejectionReason = '';

            await existingTestimonial.save();

            return res.status(200).json({
                success: true,
                message: 'Testimonial updated and submitted for approval.',
                data: existingTestimonial
            });
        } else {
            // Create new testimonial
            const newTestimonial = await Testimonial.create({
                userId,
                restaurantId,
                ownerName: ownerName.trim(),
                restaurantName: restaurantName.trim(),
                location: location.trim(),
                quote: quote.trim(),
                rating: parsedRating,
                avatar: avatarUrl,
                status: 'Pending'
            });

            return res.status(201).json({
                success: true,
                message: 'Testimonial submitted successfully! It will appear on the landing page once approved.',
                data: newTestimonial
            });
        }
    } catch (error) {
        console.error('Error saving testimonial:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit testimonial'
        });
    }
};

// @desc    Admin: Get all testimonials with optional status filter
// @route   GET /api/testimonials/admin/all
// @access  Private (SuperAdmin / Admin)
export const getAdminTestimonials = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }

        const testimonials = await Testimonial.find(filter)
            .populate('userId', 'name email role')
            .populate('restaurantId', 'name address')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: testimonials.length,
            data: testimonials
        });
    } catch (error) {
        console.error('Error fetching admin testimonials:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve testimonials' });
    }
};

// @desc    Admin: Approve or Reject a testimonial
// @route   PUT /api/testimonials/admin/:id/status
// @access  Private (SuperAdmin / Admin)
export const updateTestimonialStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;

        if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be Pending, Approved, or Rejected.'
            });
        }

        const testimonial = await Testimonial.findById(id);
        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found.'
            });
        }

        testimonial.status = status;
        if (status === 'Approved') {
            testimonial.approvedAt = new Date();
            testimonial.rejectionReason = '';
            testimonial.reviewedBy = req.user._id;
        } else if (status === 'Rejected') {
            testimonial.rejectionReason = rejectionReason || 'Content did not meet editorial guidelines.';
            testimonial.reviewedBy = req.user._id;
        }

        await testimonial.save();

        res.status(200).json({
            success: true,
            message: `Testimonial successfully marked as ${status}.`,
            data: testimonial
        });
    } catch (error) {
        console.error('Error updating testimonial status:', error);
        res.status(500).json({ success: false, message: 'Failed to update testimonial status' });
    }
};

// @desc    Admin: Delete a testimonial
// @route   DELETE /api/testimonials/admin/:id
// @access  Private (SuperAdmin)
export const deleteTestimonial = async (req, res) => {
    try {
        const { id } = req.params;
        const testimonial = await Testimonial.findByIdAndDelete(id);

        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Testimonial deleted successfully.'
        });
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        res.status(500).json({ success: false, message: 'Failed to delete testimonial' });
    }
};
