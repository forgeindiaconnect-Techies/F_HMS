import ServiceRequest from '../models/ServiceRequest.js';
import mongoose from 'mongoose';
import { broadcastToRestaurant } from '../config/websocket.js';

// @desc    Create a service request
// @route   POST /api/service-requests
// @access  Public
export const createServiceRequest = async (req, res) => {
    const { restaurantId, branchId, tableNumber, requestType } = req.body;
    try {
        let finalBranchId = branchId;
        if (!finalBranchId) {
            const Branch = mongoose.model('Branch');
            const branch = await Branch.findOne({ restaurantId });
            if (branch) finalBranchId = branch._id;
        }

        const request = await ServiceRequest.create({
            restaurantId,
            branchId: finalBranchId,
            tableNumber,
            requestType,
            status: 'Pending'
        });

        broadcastToRestaurant(restaurantId, 'new_service_request', request);

        res.status(201).json(request);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Failed to create request' });
    }
};

// @desc    Get active service requests
// @route   GET /api/service-requests
// @access  Private
export const getActiveServiceRequests = async (req, res) => {
    try {
        const filter = { status: 'Pending' };
        if (req.user.branchId) {
            filter.branchId = req.user.branchId;
        } else if (req.user.restaurantId) {
            filter.restaurantId = req.user.restaurantId;
        }
        const requests = await ServiceRequest.find(filter).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Complete a service request
// @route   PUT /api/service-requests/:id/complete
// @access  Private
export const completeServiceRequest = async (req, res) => {
    try {
        const request = await ServiceRequest.findById(req.params.id);
        if (request) {
            request.status = 'Completed';
            const updated = await request.save();

            broadcastToRestaurant(request.restaurantId, 'service_request_updated', updated);

            res.json(updated);
        } else {
            res.status(404).json({ message: 'Request not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Failed to complete request' });
    }
};
