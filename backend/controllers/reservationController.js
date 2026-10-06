import Reservation from '../models/Reservation.js';

// @desc    Get all reservations for a restaurant
// @route   GET /api/reservations
// @access  Private
export const getReservations = async (req, res) => {
    try {
        if (!req.user || (!req.user.restaurantId && req.user.role !== 'SuperAdmin')) {
            return res.json([]);
        }

        let branchIds = [];
        if (req.user.role !== 'SuperAdmin') {
            const Branch = (await import('../models/Branch.js')).default;
            const branches = await Branch.find({ restaurantId: req.user.restaurantId }).select('_id');
            branchIds = branches.map(b => b._id);
        }

        const filter = {};
        if (req.user.role !== 'SuperAdmin') {
            if (req.user.branchId) {
                filter.branch = req.user.branchId;
            } else {
                filter.branch = { $in: branchIds };
            }
        }

        const reservations = await Reservation.find(filter)
            .populate('branch', 'name location')
            .populate('table', 'tableNumber capacity')
            .sort({ date: 1, timeSlot: 1 });

        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new reservation
// @route   POST /api/reservations
// @access  Private
export const createReservation = async (req, res) => {
    const { branch, guestName, guestPhone, date, timeSlot, guestCount, table } = req.body;

    try {
        const reservation = await Reservation.create({
            branch,
            guestName,
            guestPhone,
            date,
            timeSlot,
            guestCount,
            table: table || undefined, // Optional table assignment
            status: 'Confirmed'
        });

        const populatedRes = await Reservation.findById(reservation._id)
            .populate('branch')
            .populate('table');

        res.status(201).json(populatedRes);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update reservation status
// @route   PATCH /api/reservations/:id/status
// @access  Private
export const updateReservationStatus = async (req, res) => {
    const { status } = req.body;

    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        reservation.status = status;
        await reservation.save();

        res.json(reservation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
