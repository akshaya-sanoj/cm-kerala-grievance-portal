import { Router } from 'express';
import {
  createGrievance,
  getCitizenGrievanceById,
  getMyGrievances,
  reopenGrievance,
  submitCitizenFeedback,
  trackGrievanceByReference
} from '../controllers/grievanceController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { uploadAttachment } from '../middleware/upload.js';
import { USER_ROLES } from '../utils/constants.js';

const router = Router();

// Public grievance tracking by reference ID
router.get('/track/:referenceId', trackGrievanceByReference);

// Citizen authenticated routes
router.post(
  '/',
  authenticate,
  authorizeRoles(USER_ROLES.CITIZEN),
  uploadAttachment.single('attachment'),
  createGrievance
);
router.get('/my', authenticate, authorizeRoles(USER_ROLES.CITIZEN), getMyGrievances);
router.get('/:id', authenticate, authorizeRoles(USER_ROLES.CITIZEN), getCitizenGrievanceById);
router.post(
  '/:id/feedback',
  authenticate,
  authorizeRoles(USER_ROLES.CITIZEN),
  submitCitizenFeedback
);
router.post(
  '/:id/reopen',
  authenticate,
  authorizeRoles(USER_ROLES.CITIZEN),
  reopenGrievance
);

export default router;
