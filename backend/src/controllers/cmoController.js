import { z } from 'zod';
import { ContactEnquiry } from '../models/ContactEnquiry.js';
import { Department } from '../models/Department.js';
import { DepartmentAssignment } from '../models/DepartmentAssignment.js';
import { Grievance } from '../models/Grievance.js';
import { User } from '../models/User.js';
import { analyzeGrievance } from '../services/aiService.js';
import {
  getGrievanceBundle,
  isGrievanceOverdue,
  recordHistory
} from '../services/grievanceService.js';
import {
  computeDueDate,
  GRIEVANCE_PRIORITIES,
  USER_ROLES
} from '../utils/constants.js';

const assignSchema = z.object({
  departmentId: z.string().min(1, 'Department is required'),
  officerId: z.string().optional().nullable(),
  instructions: z.string().trim().max(1500).optional().default(''),
  priority: z.enum(GRIEVANCE_PRIORITIES).optional()
});

const remarkSchema = z.object({
  remarks: z.string().trim().min(3, 'Remarks must be at least 3 characters').max(2000),
  isInternal: z.boolean().optional().default(true),
  markUnderReview: z.boolean().optional().default(true)
});

const escalateSchema = z.object({
  reason: z.string().trim().min(5, 'Escalation reason is required').max(1000),
  bumpPriorityToHigh: z.boolean().optional().default(true)
});

const reviewResolutionSchema = z.object({
  decision: z.enum(['approve', 'return']),
  remarks: z.string().trim().min(3, 'Review remarks are required').max(2000)
});

const updateEnquirySchema = z.object({
  status: z.enum(['New', 'Reviewed', 'Responded'])
});

export async function listAllGrievances(req, res, next) {
  try {
    const {
      district,
      category,
      priority,
      status,
      departmentId,
      overdueOnly,
      escalatedOnly,
      atrPendingOnly,
      search,
      page = 1,
      limit = 25
    } = req.query;

    const filter = {};
    if (district && district !== 'All') filter.district = district;
    if (category && category !== 'All') filter.category = category;
    if (priority && priority !== 'All') filter.priority = priority;
    if (status && status !== 'All') filter.status = status;
    if (departmentId && departmentId !== 'All') filter.assignedDepartmentId = departmentId;
    if (escalatedOnly === 'true') filter.isEscalated = true;
    if (atrPendingOnly === 'true') {
      filter.atrSubmitted = true;
      filter.status = { $ne: 'Resolved' };
    }
    if (overdueOnly === 'true') {
      filter.status = { $ne: 'Resolved' };
      filter.dueDate = { $lt: new Date() };
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ referenceId: regex }, { subject: regex }, { description: regex }];
    }

    const numericPage = Math.max(1, Number(page) || 1);
    const numericLimit = Math.min(100, Math.max(1, Number(limit) || 25));

    const [items, total] = await Promise.all([
      Grievance.find(filter)
        .populate('citizenId', 'name email mobileNumber')
        .populate('assignedDepartmentId', 'name code')
        .populate('assignedOfficerId', 'name designation')
        .sort({ isEscalated: -1, createdAt: -1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .lean(),
      Grievance.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        totalPages: Math.ceil(total / numericLimit)
      },
      grievances: items.map((g) => ({
        ...g,
        isOverdue: isGrievanceOverdue(g)
      }))
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCmoStats(_req, res, next) {
  try {
    const now = new Date();
    const [allGrievances, departments, enquiryCount] = await Promise.all([
      Grievance.find({})
        .select(
          'district category priority status assignedDepartmentId dueDate isEscalated atrSubmitted createdAt resolvedAt'
        )
        .lean(),
      Department.find({ isActive: true }).select('name code').sort({ name: 1 }).lean(),
      ContactEnquiry.countDocuments({})
    ]);

    const statusCounts = {
      Submitted: 0,
      'Under Review': 0,
      'In Progress': 0,
      Resolved: 0,
      Reopened: 0
    };
    const priorityCounts = { Low: 0, Medium: 0, High: 0 };
    const districtMap = new Map();
    const deptMap = new Map(
      departments.map((d) => [
        d._id.toString(),
        {
          departmentId: d._id,
          name: d.name,
          code: d.code,
          total: 0,
          resolved: 0,
          pending: 0,
          overdue: 0
        }
      ])
    );

    let overdue = 0;
    let escalated = 0;
    let atrPendingReview = 0;
    let resolutionDaysTotal = 0;
    let resolutionDaysCount = 0;

    for (const g of allGrievances) {
      statusCounts[g.status] = (statusCounts[g.status] || 0) + 1;
      priorityCounts[g.priority] = (priorityCounts[g.priority] || 0) + 1;

      const isOverdue = isGrievanceOverdue(g, now);
      if (isOverdue) overdue += 1;
      if (g.isEscalated) escalated += 1;
      if (g.atrSubmitted && g.status !== 'Resolved') atrPendingReview += 1;

      if (g.status === 'Resolved' && g.resolvedAt && g.createdAt) {
        const diffDays =
          (new Date(g.resolvedAt).getTime() - new Date(g.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        if (diffDays >= 0) {
          resolutionDaysTotal += diffDays;
          resolutionDaysCount += 1;
        }
      }

      const dEntry = districtMap.get(g.district) || {
        district: g.district,
        total: 0,
        resolved: 0,
        pending: 0,
        overdue: 0
      };
      dEntry.total += 1;
      if (g.status === 'Resolved') dEntry.resolved += 1;
      else dEntry.pending += 1;
      if (isOverdue) dEntry.overdue += 1;
      districtMap.set(g.district, dEntry);

      if (g.assignedDepartmentId) {
        const deptEntry = deptMap.get(g.assignedDepartmentId.toString());
        if (deptEntry) {
          deptEntry.total += 1;
          if (g.status === 'Resolved') deptEntry.resolved += 1;
          else deptEntry.pending += 1;
          if (isOverdue) deptEntry.overdue += 1;
        }
      }
    }

    const total = allGrievances.length;
    const resolved = statusCounts.Resolved;
    const pending = total - resolved;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const avgResolutionDays =
      resolutionDaysCount > 0
        ? Number((resolutionDaysTotal / resolutionDaysCount).toFixed(1))
        : 0;

    return res.json({
      success: true,
      stats: {
        overview: {
          total,
          pending,
          resolved,
          overdue,
          escalated,
          atrPendingReview,
          contactEnquiries: enquiryCount,
          resolutionRate,
          avgResolutionDays
        },
        byStatus: statusCounts,
        byPriority: priorityCounts,
        byDistrict: Array.from(districtMap.values()).sort((a, b) => b.total - a.total),
        byDepartment: Array.from(deptMap.values()).sort((a, b) => b.total - a.total)
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCmoGrievanceDetail(req, res, next) {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate('citizenId', 'name email mobileNumber district')
      .populate('assignedDepartmentId', 'name code headDesignation')
      .populate('assignedOfficerId', 'name email designation');

    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }

    const bundle = await getGrievanceBundle(grievance, USER_ROLES.CMO_ADMIN);
    return res.json({ success: true, grievance: bundle });
  } catch (error) {
    return next(error);
  }
}

export async function listDepartmentOfficers(_req, res, next) {
  try {
    const officers = await User.find({
      role: USER_ROLES.DEPARTMENT_OFFICER,
      isActive: true
    })
      .populate('departmentId', 'name code')
      .select('name email designation district departmentId')
      .sort({ name: 1 })
      .lean();

    return res.json({ success: true, officers });
  } catch (error) {
    return next(error);
  }
}

export async function runCmoAiReview(req, res, next) {
  try {
    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }

    const [departments, existingGrievances] = await Promise.all([
      Department.find({ isActive: true }).select('name code').lean(),
      Grievance.find({ _id: { $ne: grievance._id } })
        .sort({ createdAt: -1 })
        .limit(60)
        .select('referenceId subject description district status')
        .lean()
    ]);

    const analysis = await analyzeGrievance({
      subject: grievance.subject,
      description: grievance.description,
      district: grievance.district,
      category: grievance.category,
      departments,
      existingGrievances
    });

    grievance.aiAnalysis = {
      ...analysis,
      citizenAccepted: grievance.aiAnalysis?.citizenAccepted || false,
      cmoReviewed: true
    };
    await grievance.save();

    return res.json({
      success: true,
      message: 'AI analysis updated for CMO review.',
      aiAnalysis: grievance.aiAnalysis
    });
  } catch (error) {
    return next(error);
  }
}

export async function assignGrievance(req, res, next) {
  try {
    const data = assignSchema.parse(req.body);
    const [grievance, department] = await Promise.all([
      Grievance.findById(req.params.id),
      Department.findById(data.departmentId)
    ]);

    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    let officer = null;
    if (data.officerId) {
      officer = await User.findOne({
        _id: data.officerId,
        role: USER_ROLES.DEPARTMENT_OFFICER,
        departmentId: department._id
      });
      if (!officer) {
        return res.status(400).json({
          success: false,
          message: 'Selected officer does not belong to the chosen department.'
        });
      }
    } else {
      officer = await User.findOne({
        role: USER_ROLES.DEPARTMENT_OFFICER,
        departmentId: department._id,
        isActive: true
      });
    }

    await DepartmentAssignment.updateMany(
      { grievanceId: grievance._id, status: 'Active' },
      { $set: { status: 'Reassigned' } }
    );

    const previousStatus = grievance.status;
    const nextPriority = data.priority || grievance.priority;
    const nextDueDate =
      data.priority && data.priority !== grievance.priority
        ? computeDueDate(nextPriority)
        : grievance.dueDate;

    const assignment = await DepartmentAssignment.create({
      grievanceId: grievance._id,
      departmentId: department._id,
      officerId: officer ? officer._id : null,
      assignedBy: req.user._id,
      instructions: data.instructions,
      dueDate: nextDueDate,
      status: 'Active'
    });

    grievance.assignedDepartmentId = department._id;
    grievance.assignedOfficerId = officer ? officer._id : null;
    grievance.priority = nextPriority;
    grievance.dueDate = nextDueDate;
    grievance.status = 'Under Review';
    grievance.workflowStage = 'Forwarded to Department';
    grievance.atrSubmitted = false;
    if (grievance.aiAnalysis) {
      grievance.aiAnalysis.cmoReviewed = true;
    }
    await grievance.save();

    await recordHistory({
      grievanceId: grievance._id,
      previousStatus,
      newStatus: 'Under Review',
      workflowStage: 'Forwarded to Department',
      actionType: 'ASSIGNED',
      remarks: `Forwarded to ${department.name}${
        officer ? ` (Officer: ${officer.name})` : ''
      }.${data.instructions ? ` Instructions: ${data.instructions}` : ''}`,
      isInternal: false,
      user: req.user
    });

    const populated = await Grievance.findById(grievance._id)
      .populate('citizenId', 'name email mobileNumber district')
      .populate('assignedDepartmentId', 'name code headDesignation')
      .populate('assignedOfficerId', 'name email designation');

    const bundle = await getGrievanceBundle(populated, USER_ROLES.CMO_ADMIN);
    return res.json({
      success: true,
      message: `Grievance assigned to ${department.name}.`,
      assignment,
      grievance: bundle
    });
  } catch (error) {
    return next(error);
  }
}

export async function addCmoRemark(req, res, next) {
  try {
    const data = remarkSchema.parse(req.body);
    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }

    const previousStatus = grievance.status;
    let actionType = 'REMARK_ADDED';
    if (data.markUnderReview && (grievance.status === 'Submitted' || grievance.status === 'Reopened')) {
      grievance.status = 'Under Review';
      grievance.workflowStage = 'Under CMO Review';
      actionType = 'CMO_REVIEW';
      await grievance.save();
    }

    await recordHistory({
      grievanceId: grievance._id,
      previousStatus,
      newStatus: grievance.status,
      workflowStage: grievance.workflowStage,
      actionType,
      remarks: data.remarks,
      isInternal: data.isInternal,
      user: req.user
    });

    const populated = await Grievance.findById(grievance._id)
      .populate('citizenId', 'name email mobileNumber district')
      .populate('assignedDepartmentId', 'name code headDesignation')
      .populate('assignedOfficerId', 'name email designation');

    const bundle = await getGrievanceBundle(populated, USER_ROLES.CMO_ADMIN);
    return res.json({
      success: true,
      message: data.isInternal
        ? 'Internal CMO administrative remark added.'
        : 'Public CMO remark added.',
      grievance: bundle
    });
  } catch (error) {
    return next(error);
  }
}

export async function escalateGrievance(req, res, next) {
  try {
    const data = escalateSchema.parse(req.body);
    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }

    if (grievance.status === 'Resolved') {
      return res.status(400).json({
        success: false,
        message: 'Resolved grievances cannot be escalated.'
      });
    }

    const previousStatus = grievance.status;
    grievance.isEscalated = true;
    grievance.escalationReason = data.reason;
    grievance.escalatedAt = new Date();
    grievance.escalatedBy = req.user._id;
    if (data.bumpPriorityToHigh) {
      grievance.priority = 'High';
    }
    if (grievance.status === 'Submitted') {
      grievance.status = 'Under Review';
      grievance.workflowStage = 'Escalated by CMO';
    }
    await grievance.save();

    await recordHistory({
      grievanceId: grievance._id,
      previousStatus,
      newStatus: grievance.status,
      workflowStage: grievance.workflowStage,
      actionType: 'ESCALATED',
      remarks: `Escalated by CMO: ${data.reason}`,
      isInternal: false,
      user: req.user
    });

    const populated = await Grievance.findById(grievance._id)
      .populate('citizenId', 'name email mobileNumber district')
      .populate('assignedDepartmentId', 'name code headDesignation')
      .populate('assignedOfficerId', 'name email designation');

    const bundle = await getGrievanceBundle(populated, USER_ROLES.CMO_ADMIN);
    return res.json({
      success: true,
      message: 'Grievance escalated for priority attention.',
      grievance: bundle
    });
  } catch (error) {
    return next(error);
  }
}

export async function reviewDepartmentResolution(req, res, next) {
  try {
    const data = reviewResolutionSchema.parse(req.body);
    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }

    const previousStatus = grievance.status;

    if (data.decision === 'approve') {
      grievance.status = 'Resolved';
      grievance.workflowStage = 'Resolved by CMO';
      grievance.resolvedAt = new Date();
      grievance.isEscalated = false;
      await grievance.save();

      await DepartmentAssignment.updateMany(
        { grievanceId: grievance._id, status: 'Active' },
        { $set: { status: 'Completed', completedAt: new Date() } }
      );

      await recordHistory({
        grievanceId: grievance._id,
        previousStatus,
        newStatus: 'Resolved',
        workflowStage: 'Resolved by CMO',
        actionType: 'RESOLVED',
        remarks: `CMO approved resolution: ${data.remarks}`,
        isInternal: false,
        user: req.user
      });
    } else {
      grievance.status = 'In Progress';
      grievance.workflowStage = 'Returned to Department for Revision';
      grievance.atrSubmitted = false;
      await grievance.save();

      await recordHistory({
        grievanceId: grievance._id,
        previousStatus,
        newStatus: 'In Progress',
        workflowStage: 'Returned to Department for Revision',
        actionType: 'CMO_REVIEW',
        remarks: `CMO requested further action from department: ${data.remarks}`,
        isInternal: false,
        user: req.user
      });
    }

    const populated = await Grievance.findById(grievance._id)
      .populate('citizenId', 'name email mobileNumber district')
      .populate('assignedDepartmentId', 'name code headDesignation')
      .populate('assignedOfficerId', 'name email designation');

    const bundle = await getGrievanceBundle(populated, USER_ROLES.CMO_ADMIN);
    return res.json({
      success: true,
      message:
        data.decision === 'approve'
          ? 'Grievance marked as Resolved.'
          : 'Resolution returned to department for follow-up.',
      grievance: bundle
    });
  } catch (error) {
    return next(error);
  }
}

export async function listContactEnquiries(_req, res, next) {
  try {
    const enquiries = await ContactEnquiry.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, enquiries });
  } catch (error) {
    return next(error);
  }
}

export async function updateContactEnquiryStatus(req, res, next) {
  try {
    const data = updateEnquirySchema.parse(req.body);
    const enquiry = await ContactEnquiry.findByIdAndUpdate(
      req.params.id,
      { status: data.status },
      { new: true }
    );
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Contact enquiry not found.' });
    }
    return res.json({ success: true, enquiry });
  } catch (error) {
    return next(error);
  }
}

export async function escalateAllOverdue(req, res, next) {
  try {
    const now = new Date();
    const overdueList = await Grievance.find({
      status: { $ne: 'Resolved' },
      dueDate: { $lt: now },
      isEscalated: false
    });

    if (overdueList.length === 0) {
      return res.json({
        success: true,
        escalatedCount: 0,
        message: 'No unescalated overdue grievances found.'
      });
    }

    for (const g of overdueList) {
      const previousStatus = g.status;
      g.isEscalated = true;
      g.priority = 'High';
      g.escalationReason = 'Auto-escalated by CMO SLA sweep due to overdue target date.';
      g.escalatedAt = now;
      g.escalatedBy = req.user._id;
      if (g.status === 'Submitted') {
        g.status = 'Under Review';
        g.workflowStage = 'Escalated by CMO';
      }
      await g.save();

      await recordHistory({
        grievanceId: g._id,
        previousStatus,
        newStatus: g.status,
        workflowStage: g.workflowStage,
        actionType: 'ESCALATED',
        remarks: 'Auto-escalated by CMO SLA overdue sweep (priority set to High).',
        isInternal: false,
        user: req.user
      });
    }

    return res.json({
      success: true,
      escalatedCount: overdueList.length,
      message: `Escalated ${overdueList.length} overdue grievance(s) to High priority.`
    });
  } catch (error) {
    return next(error);
  }
}
