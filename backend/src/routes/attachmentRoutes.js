import { Router } from 'express';
import { downloadAttachment } from '../controllers/attachmentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/:id/download', authenticate, downloadAttachment);

export default router;
