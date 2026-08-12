import express from 'express';
import { registerUser, loginUser, logoutUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { verificationUpload } from '../controllers/verificationController.js';

const router = express.Router();

router.post('/register', (req, res, next) => {
    verificationUpload(req, res, (err) => {
        if (err) {
            console.error("Verification upload error:", err);
            return res.status(400).json({ message: err.message || 'File upload error' });
        }
        next();
    });
}, registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);

// Example of a protected route for testing
router.get('/profile', protect, (req, res) => {
    res.json({ user: req.user });
});

export default router;
