import { Router } from 'express';
import {
  getOfficerGrievanceDetail,
  getOfficerGrievances,
  submitActionTakenReport,
  updateInvestigationProgress
} from '../controllers/officerController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { uploadAttachment } from '../middleware/upload.js';
import { USER_ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate, authorizeRoles(USER_ROLES.DEPARTMENT_OFFICER));

router.get('/grievances', getOfficerGrievances);
router.get('/grievances/:id', getOfficerGrievanceDetail);
router.patch('/grievances/:id/investigate', updateInvestigationProgress);
router.post(
  '/grievances/:id/atr',
  uploadAttachment.single('attachment'),
  submitActionTakenReport
);

export default router;
