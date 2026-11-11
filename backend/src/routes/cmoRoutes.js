import { Router } from 'express';
import {
  addCmoRemark,
  assignGrievance,
  escalateGrievance,
  getCmoGrievanceDetail,
  getCmoStats,
  listAllGrievances,
  listContactEnquiries,
  listDepartmentOfficers,
  reviewDepartmentResolution,
  runCmoAiReview,
  updateContactEnquiryStatus
} from '../controllers/cmoController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate, authorizeRoles(USER_ROLES.CMO_ADMIN));

router.get('/stats', getCmoStats);
router.get('/officers', listDepartmentOfficers);
router.get('/enquiries', listContactEnquiries);
router.patch('/enquiries/:id', updateContactEnquiryStatus);

router.get('/grievances', listAllGrievances);
router.get('/grievances/:id', getCmoGrievanceDetail);
router.post('/grievances/:id/ai-review', runCmoAiReview);
router.post('/grievances/:id/assign', assignGrievance);
router.post('/grievances/:id/remarks', addCmoRemark);
router.post('/grievances/:id/escalate', escalateGrievance);
router.post('/grievances/:id/review-resolution', reviewDepartmentResolution);

export default router;
