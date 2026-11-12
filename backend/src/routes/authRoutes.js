import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getCurrentUser, getRecentActivity, login, registerCitizen } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
});

router.post('/register', authLimiter, registerCitizen);
router.post('/login', authLimiter, login);
router.get('/me', authenticate, getCurrentUser);
router.get('/activity', authenticate, getRecentActivity);

export default router;
