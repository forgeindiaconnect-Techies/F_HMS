import Offer from '../models/Offer.js';

// @desc    Get all offers
// @route   GET /api/offers
// @access  Public
export const getOffers = async (req, res) => {
    try {
        const offers = await Offer.find({}).sort({ createdAt: -1 });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create an offer
// @route   POST /api/offers
// @access  Private (Admin / Manager)
export const createOffer = async (req, res) => {
    const { code, type, discountValue, minSpend, expiresAt, usageLimit, isActive } = req.body;

    try {
        const offerExists = await Offer.findOne({ code: code.toUpperCase() });

        if (offerExists) {
            return res.status(400).json({ message: 'Offer code already exists' });
        }

        const offer = await Offer.create({
            code: code.toUpperCase(),
            type,
            discountValue,
            minSpend,
            expiresAt,
            usageLimit: usageLimit || 0,
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json(offer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update an offer
// @route   PUT /api/offers/:id
// @access  Private (Admin / Manager)
export const updateOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (offer) {
            offer.code = req.body.code ? req.body.code.toUpperCase() : offer.code;
            offer.type = req.body.type || offer.type;
            offer.discountValue = req.body.discountValue !== undefined ? req.body.discountValue : offer.discountValue;
            offer.minSpend = req.body.minSpend !== undefined ? req.body.minSpend : offer.minSpend;
            offer.expiresAt = req.body.expiresAt !== undefined ? req.body.expiresAt : offer.expiresAt;
            offer.usageLimit = req.body.usageLimit !== undefined ? req.body.usageLimit : offer.usageLimit;
            offer.isActive = req.body.isActive !== undefined ? req.body.isActive : offer.isActive;

            const updatedOffer = await offer.save();
            res.json(updatedOffer);
        } else {
            res.status(404).json({ message: 'Offer not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete an offer
// @route   DELETE /api/offers/:id
// @access  Private (Admin / Manager)
export const deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (offer) {
            await offer.deleteOne();
            res.json({ message: 'Offer removed' });
        } else {
            res.status(404).json({ message: 'Offer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
