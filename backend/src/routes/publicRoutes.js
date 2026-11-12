import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getDepartments,
  getHealth,
  getMetadata,
  getPublicStats,
  runPublicAiPreview,
  submitContactEnquiry
} from '../controllers/publicController.js';

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many contact submissions. Please wait and try again.' }
});

const aiDemoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI preview requests. Please sign in for full access.' }
});

router.get('/health', getHealth);
router.get('/public/stats', getPublicStats);
router.post('/public/ai-preview', aiDemoLimiter, runPublicAiPreview);
router.get('/departments', getDepartments);
router.get('/metadata', getMetadata);
router.post('/contact', contactLimiter, submitContactEnquiry);

export default router;
