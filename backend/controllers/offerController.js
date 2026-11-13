import mongoose from 'mongoose';
import Offer from '../models/Offer.js';

let offersCache = { data: null, expiresAt: 0 };
export const clearOffersCache = () => {
    offersCache = { data: null, expiresAt: 0 };
};

// @desc    Get all offers
// @route   GET /api/offers
// @access  Public
export const getOffers = async (req, res) => {
    try {
        const now = Date.now();
        if (offersCache.data && offersCache.expiresAt > now) {
            return res.json(offersCache.data);
        }
        const offers = await Offer.find({}).sort({ createdAt: -1 }).lean();
        offersCache = { data: offers, expiresAt: now + 30000 };
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
        if (!code || typeof code !== 'string' || !code.trim()) {
            return res.status(400).json({ message: 'Promo code is required and cannot be empty' });
        }

        const normalizedCode = code.trim().toUpperCase();

        const numDiscount = Number(discountValue);
        if (isNaN(numDiscount) || numDiscount <= 0) {
            return res.status(400).json({ message: 'Valid discount value greater than 0 is required' });
        }

        const offerExists = await Offer.findOne({ code: normalizedCode });

        if (offerExists) {
            return res.status(400).json({ 
                message: `Promo code "${normalizedCode}" already exists. Please choose a unique code or edit the existing one.` 
            });
        }

        const offer = await Offer.create({
            code: normalizedCode,
            type: type || 'Percentage',
            discountValue: numDiscount,
            minSpend: Number(minSpend) || 0,
            expiresAt: expiresAt || null,
            usageLimit: Number(usageLimit) || 0,
            isActive: isActive !== undefined ? Boolean(isActive) : true
        });

        clearOffersCache();
        res.status(201).json(offer);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Failed to create offer' });
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
            clearOffersCache();
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
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Offer ID or code is required' });
        }

        let offer = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
            offer = await Offer.findById(id);
        }
        if (!offer) {
            offer = await Offer.findOne({ code: id.trim().toUpperCase() });
        }

        if (offer) {
            await Offer.findByIdAndDelete(offer._id);
            clearOffersCache();
            return res.json({ message: 'Offer removed successfully', id: offer._id, code: offer.code });
        } else {
            return res.status(404).json({ message: 'Offer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message || 'Failed to delete offer' });
    }
};
