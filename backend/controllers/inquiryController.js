import Inquiry from '../models/Inquiry.js';

// @desc    Create new public inquiry
// @route   POST /api/inquiries
// @access  Public
export const createInquiry = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            restaurantName,
            restaurantId,
            branchId,
            customerId,
            source,
            subject,
            message
        } = req.body;

        if (!name || (!message && (!phone || !restaurantName))) {
            return res.status(400).json({ message: 'Name and message (or phone and restaurant name) are required' });
        }

        const cleanPhone = (phone || '').toString().trim();
        const inquiry = new Inquiry({
            name: name.trim(),
            email: email || `${cleanPhone.replace(/\D/g, '') || 'lead'}@lead.restauranthub.com`,
            phone: cleanPhone || 'N/A',
            restaurantName: (restaurantName || '').trim() || 'General',
            restaurantId: restaurantId || null,
            branchId: branchId || null,
            customerId: customerId || null,
            source: source === 'Customer' ? 'Customer' : 'Public',
            subject: subject || 'Demo',
            message: message || 'Free Walkthrough Demo requested'
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

// @desc    Get customer inquiries for Restaurant Admin / Branch Manager
// @route   GET /api/inquiries/restaurant
// @access  Private/RestaurantAdmin,Admin,BranchManager,SuperAdmin
export const getRestaurantInquiries = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'SuperAdmin') {
            const orConditions = [{ source: 'Customer', restaurantId: null }];
            if (req.user.restaurantId) {
                orConditions.push({ restaurantId: req.user.restaurantId });
            }
            query = { $or: orConditions };
        }

        const inquiries = await Inquiry.find(query).sort({ createdAt: -1 }).limit(100);
        res.json(inquiries);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Get logged-in customer's own inquiries/tickets
// @route   GET /api/inquiries/mine
// @access  Private
export const getMyCustomerInquiries = async (req, res) => {
    try {
        const orConditions = [{ customerId: req.user._id }];
        if (req.user.email) {
            orConditions.push({ email: req.user.email, source: 'Customer' });
        }
        const inquiries = await Inquiry.find({ $or: orConditions }).sort({ createdAt: -1 }).limit(50);
        res.json(inquiries);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Update inquiry status (Restaurant Admin / Branch Manager / Super Admin)
// @route   PUT /api/inquiries/restaurant/:id
// @access  Private/RestaurantAdmin,Admin,BranchManager,SuperAdmin
export const updateRestaurantInquiryStatus = async (req, res) => {
    try {
        const { status, adminReply } = req.body;
        if (!status || !['New', 'In Progress', 'Resolved'].includes(status)) {
            return res.status(400).json({ message: 'Valid status is required (New, In Progress, Resolved)' });
        }

        const inquiry = await Inquiry.findById(req.params.id);
        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        if (
            req.user.role !== 'SuperAdmin' &&
            inquiry.restaurantId &&
            req.user.restaurantId &&
            inquiry.restaurantId.toString() !== req.user.restaurantId.toString()
        ) {
            return res.status(403).json({ message: 'Not authorized to update this inquiry' });
        }

        inquiry.status = status;
        if (adminReply !== undefined) {
            inquiry.adminReply = adminReply;
            inquiry.repliedAt = new Date();
        }
        await inquiry.save();
        res.json(inquiry);
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

// @desc    Delete inquiry (Super Admin only)
// @route   DELETE /api/inquiries/admin/:id
// @access  Private/SuperAdmin
export const deleteInquiry = async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id);
        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }
        await Inquiry.findByIdAndDelete(req.params.id);
        res.json({ message: 'Inquiry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

