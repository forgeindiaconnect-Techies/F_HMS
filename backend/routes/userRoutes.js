import express from 'express';
import { getUsers, inviteUser, deleteUser } from '../controllers/userController.js';
import { protect, authorize, checkSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('RestaurantAdmin', 'SuperAdmin', 'SupportAgent'));
router.use(checkSubscription);

router.route('/')
    .get(getUsers)
    .post(inviteUser);

router.route('/:id')
    .delete(deleteUser);

export default router;
