import { z } from 'zod';
import { Grievance } from '../models/Grievance.js';
import {
  createAttachmentRecord,
  getGrievanceBundle,
  isGrievanceOverdue,
  recordHistory
} from '../services/grievanceService.js';
import { USER_ROLES } from '../utils/constants.js';

const investigationSchema = z.object({
  remarks: z
    .string()
    .trim()
    .min(5, 'Investigation remarks must be at least 5 characters')
    .max(2000)
});

const atrSchema = z.object({
  actionTakenReport: z
    .string()
    .trim()
    .min(10, 'Action-taken report must be at least 10 characters')
    .max(4000)
});

function officerOwnsDepartment(grievance, user) {
  if (!user.departmentId || !grievance.assignedDepartmentId) return false;
  const userDeptId = user.departmentId._id
    ? user.departmentId._id.toString()
    : user.departmentId.toString();
  const grievanceDeptId = grievance.assignedDepartmentId._id
    ? grievance.assignedDepartmentId._id.toString()
    : grievance.assignedDepartmentId.toString();
  return userDeptId === grievanceDeptId;
}

export async function getOfficerGrievances(req, res, next) {
  try {
    const userDeptId = req.user.departmentId?._id || req.user.departmentId;
    if (!userDeptId) {
      return res.status(400).json({
        success: false,
        message: 'Officer account is not linked to a department.'
      });
    }

    const { status, priority, search } = req.query;
    const filter = { assignedDepartmentId: userDeptId };

    if (status && status !== 'All') filter.status = status;
    if (priority && priority !== 'All') filter.priority = priority;
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ referenceId: regex }, { subject: regex }];
    }

    const [grievances, allDeptGrievances] = await Promise.all([
      Grievance.find(filter)
        .populate('citizenId', 'name district')
        .populate('assignedDepartmentId', 'name code')
        .sort({ isEscalated: -1, dueDate: 1 })
        .lean(),
      Grievance.find({ assignedDepartmentId: userDeptId })
        .select('status atrSubmitted dueDate')
        .lean()
    ]);

    const summary = {
      total: allDeptGrievances.length,
      underReview: allDeptGrievances.filter((g) => g.status === 'Under Review').length,
      inProgress: allDeptGrievances.filter((g) => g.status === 'In Progress').length,
      atrSubmitted: allDeptGrievances.filter((g) => g.atrSubmitted && g.status !== 'Resolved')
        .length,
      resolved: allDeptGrievances.filter((g) => g.status === 'Resolved').length,
      overdue: allDeptGrievances.filter((g) => isGrievanceOverdue(g)).length
    };

    return res.json({
      success: true,
      department: req.user.departmentId,
      summary,
      grievances: grievances.map((g) => ({
        ...g,
        isOverdue: isGrievanceOverdue(g)
      }))
    });
  } catch (error) {
    return next(error);
  }
}

export async function getOfficerGrievanceDetail(req, res, next) {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate('citizenId', 'name email mobileNumber district')
      .populate('assignedDepartmentId', 'name code headDesignation')
      .populate('assignedOfficerId', 'name designation');

    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }
    if (!officerOwnsDepartment(grievance, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This grievance is not assigned to your department.'
      });
    }

    const bundle = await getGrievanceBundle(grievance, USER_ROLES.DEPARTMENT_OFFICER);
    return res.json({ success: true, grievance: bundle });
  } catch (error) {
    return next(error);
  }
}

export async function updateInvestigationProgress(req, res, next) {
  try {
    const data = investigationSchema.parse(req.body);
    const grievance = await Grievance.findById(req.params.id)
      .populate('assignedDepartmentId', 'name code')
      .populate('citizenId', 'name email mobileNumber district');

    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }
    if (!officerOwnsDepartment(grievance, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This grievance is not assigned to your department.'
      });
    }
    if (grievance.status === 'Resolved') {
      return res.status(400).json({
        success: false,
        message: 'Resolved grievances cannot be modified unless reopened.'
      });
    }

    const previousStatus = grievance.status;
    grievance.status = 'In Progress';
    grievance.workflowStage = 'Officer Investigating';
    if (!grievance.assignedOfficerId) {
      grievance.assignedOfficerId = req.user._id;
    }
    await grievance.save();

    await recordHistory({
      grievanceId: grievance._id,
      previousStatus,
      newStatus: 'In Progress',
      workflowStage: 'Officer Investigating',
      actionType: 'OFFICER_UPDATE',
      remarks: data.remarks,
      isInternal: false,
      user: req.user
    });

    const bundle = await getGrievanceBundle(grievance, USER_ROLES.DEPARTMENT_OFFICER);
    return res.json({
      success: true,
      message: 'Investigation progress updated.',
      grievance: bundle
    });
  } catch (error) {
    return next(error);
  }
}

export async function submitActionTakenReport(req, res, next) {
  try {
    const data = atrSchema.parse(req.body);
    const grievance = await Grievance.findById(req.params.id)
      .populate('assignedDepartmentId', 'name code')
      .populate('citizenId', 'name email mobileNumber district');

    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }
    if (!officerOwnsDepartment(grievance, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This grievance is not assigned to your department.'
      });
    }
    if (grievance.status === 'Resolved') {
      return res.status(400).json({
        success: false,
        message: 'Grievance is already marked as Resolved.'
      });
    }

    if (req.file) {
      await createAttachmentRecord({
        file: req.file,
        grievanceId: grievance._id,
        user: req.user,
        attachmentType: 'action_taken_report'
      });
    }

    const previousStatus = grievance.status;
    grievance.status = 'In Progress';
    grievance.workflowStage = 'ATR Submitted for CMO Review';
    grievance.actionTakenReport = data.actionTakenReport;
    grievance.atrSubmitted = true;
    grievance.atrSubmittedAt = new Date();
    grievance.atrSubmittedBy = req.user._id;
    if (!grievance.assignedOfficerId) {
      grievance.assignedOfficerId = req.user._id;
    }
    await grievance.save();

    await recordHistory({
      grievanceId: grievance._id,
      previousStatus,
      newStatus: 'In Progress',
      workflowStage: 'ATR Submitted for CMO Review',
      actionType: 'ATR_SUBMITTED',
      remarks: `Department submitted Action-Taken Report for CMO review: ${data.actionTakenReport}`,
      isInternal: false,
      user: req.user
    });

    const bundle = await getGrievanceBundle(grievance, USER_ROLES.DEPARTMENT_OFFICER);
    return res.json({
      success: true,
      message: 'Action-taken report submitted back to CMO for review.',
      grievance: bundle
    });
  } catch (error) {
    return next(error);
  }
}
