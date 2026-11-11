import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { analyzeGrievanceText } from '../controllers/aiController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI analysis rate limit exceeded. Please try again shortly.' }
});

router.post(
  '/analyze',
  authenticate,
  authorizeRoles(USER_ROLES.CITIZEN, USER_ROLES.CMO_ADMIN),
  aiLimiter,
  analyzeGrievanceText
);

export default router;
