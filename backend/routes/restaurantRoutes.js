import express from 'express';
import { 
    getRestaurants, getRestaurantById, createRestaurant, getBranches, 
    createBranch, getMyRestaurant, updateMyRestaurant, updateSubscription, 
    selfSubscribe, logoUpload, getMyBillingHistory, upgradeSubscription, 
    downgradeSubscription, renewSubscription 
} from '../controllers/restaurantController.js';
import { submitVerification, getMyVerification, getAllVerifications, getVerificationById, reviewVerification, verificationUpload, deleteVerification } from '../controllers/verificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/verification/submit')
    .post(protect, authorize('RestaurantAdmin'), (req, res, next) => {
        verificationUpload(req, res, (err) => {
            if (err) {
                console.error("Verification upload error:", err);
                return res.status(400).json({ message: err.message || 'File upload failed.' });
            }
            next();
        });
    }, submitVerification);

router.route('/verification/mine')
    .get(protect, authorize('RestaurantAdmin'), getMyVerification);

router.route('/verification/all')
    .get(protect, authorize('SuperAdmin'), getAllVerifications);

router.route('/verification/:id')
    .get(protect, authorize('SuperAdmin'), getVerificationById)
    .delete(protect, authorize('SuperAdmin'), deleteVerification);

router.route('/verification/:id/review')
    .put(protect, authorize('SuperAdmin'), reviewVerification);

router.route('/mine')
    .get(protect, getMyRestaurant)
    .put(protect, authorize('RestaurantAdmin'), logoUpload, updateMyRestaurant);

router.route('/mine/billing-history')
    .get(protect, authorize('RestaurantAdmin'), getMyBillingHistory);

router.route('/mine/upgrade')
    .post(protect, authorize('RestaurantAdmin'), upgradeSubscription);

router.route('/mine/downgrade')
    .post(protect, authorize('RestaurantAdmin'), downgradeSubscription);

router.route('/mine/renew')
    .post(protect, authorize('RestaurantAdmin'), renewSubscription);

router.route('/subscribe')
    .put(protect, authorize('RestaurantAdmin'), selfSubscribe);

router.route('/')
    .get(getRestaurants)
    .post(protect, authorize('SuperAdmin'), createRestaurant);

router.route('/:id')
    .get(getRestaurantById);

router.route('/:id/subscription')
    .put(protect, authorize('SuperAdmin'), updateSubscription);

router.route('/:id/branches')
    .get(getBranches)
    .post(protect, authorize('RestaurantAdmin'), createBranch);

export default router;
