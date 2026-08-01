import Inquiry from '../models/Inquiry.js';

// @desc    Create new public inquiry
// @route   POST /api/inquiries
// @access  Public
export const createInquiry = async (req, res) => {
    try {
        const { name, email, restaurantName, subject, message } = req.body;

        if (!name || !email || !restaurantName || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const inquiry = new Inquiry({
            name,
            email,
            restaurantName,
            subject,
            message
        });

        await inquiry.save();
        res.status(201).json({ success: true, data: inquiry });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Get all inquiries (Super Admin only)
// @route   GET /api/inquiries/admin
// @access  Private/SuperAdmin
export const getInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.find().sort({ createdAt: -1 });
        res.json(inquiries);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Update inquiry status (Super Admin only)
// @route   PUT /api/inquiries/admin/:id
// @access  Private/SuperAdmin
export const updateInquiryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const inquiry = await Inquiry.findById(req.params.id);
        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        inquiry.status = status;
        await inquiry.save();

        res.json(inquiry);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
