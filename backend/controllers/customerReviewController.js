import CustomerReview from '../models/CustomerReview.js';

// @desc    Get all approved customer reviews for public landing page
// @route   GET /api/customer-reviews/public
// @access  Public
export const getPublicCustomerReviews = async (req, res) => {
    try {
        const reviews = await CustomerReview.find({ status: 'Approved' })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        console.error('Error fetching public customer reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch customer reviews' });
    }
};

// @desc    Get customer's own submitted reviews
// @route   GET /api/customer-reviews/mine
// @access  Private (Customer)
export const getMyCustomerReviews = async (req, res) => {
    try {
        const userId = req.user._id;
        const reviews = await CustomerReview.find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch your reviews' });
    }
};

// @desc    Submit or update a customer review
// @route   POST /api/customer-reviews
// @access  Private (Customer)
export const submitCustomerReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const { rating, reviewText, orderId } = req.body;

        if (!reviewText || !reviewText.trim()) {
            return res.status(400).json({ success: false, message: 'Review text is required' });
        }

        const numRating = Number(rating) || 5;
        if (numRating < 1 || numRating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        const customerName = req.user.name || 'Foodie Customer';
        const customerEmail = req.user.email || '';
        const avatar = req.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=FF5A1F&color=fff`;

        const newReview = await CustomerReview.create({
            userId,
            customerName,
            customerEmail,
            avatar,
            rating: numRating,
            reviewText: reviewText.trim(),
            orderId: orderId || null,
            status: 'Approved'
        });

        res.status(201).json({
            success: true,
            message: 'Your review has been submitted and is now featured on the landing page!',
            data: newReview
        });
    } catch (error) {
        console.error('Error submitting customer review:', error);
        res.status(500).json({ success: false, message: 'Failed to submit review' });
    }
};

// @desc    Delete a customer review
// @route   DELETE /api/customer-reviews/:id
// @access  Private (Customer / Admin)
export const deleteCustomerReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await CustomerReview.findById(id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Allow owner of review or SuperAdmin/Admin
        const isOwner = review.userId.toString() === req.user._id.toString();
        const isAdmin = ['SuperAdmin', 'Admin'].includes(req.user.role);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
        }

        await CustomerReview.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ success: false, message: 'Failed to delete review' });
    }
};
