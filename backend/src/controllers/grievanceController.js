import { z } from 'zod';
import { CitizenFeedback } from '../models/CitizenFeedback.js';
import { Department } from '../models/Department.js';
import { Grievance } from '../models/Grievance.js';
import { GrievanceHistory } from '../models/GrievanceHistory.js';
import { analyzeGrievance } from '../services/aiService.js';
import {
  createAttachmentRecord,
  getGrievanceBundle,
  isGrievanceOverdue,
  recordHistory
} from '../services/grievanceService.js';
import {
  computeDueDate,
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_PRIORITIES,
  KERALA_DISTRICTS,
  USER_ROLES
} from '../utils/constants.js';
import { generateReferenceId } from '../utils/referenceId.js';

const createGrievanceSchema = z.object({
  district: z.enum(KERALA_DISTRICTS),
  category: z.enum(GRIEVANCE_CATEGORIES),
  subject: z.string().trim().min(5, 'Subject must be at least 5 characters').max(200),
  description: z.string().trim().min(15, 'Description must be at least 15 characters').max(5000),
  priority: z.enum(GRIEVANCE_PRIORITIES).optional().default('Medium'),
  aiAnalysis: z.any().optional()
});

const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  isSatisfied: z.boolean().optional().default(true),
  comment: z.string().trim().max(1500).optional().default('')
});

const reopenSchema = z.object({
  reason: z.string().trim().min(5, 'Please provide a reason for reopening').max(1500)
});

async function allocateUniqueReferenceId() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateReferenceId();
    const exists = await Grievance.exists({ referenceId: candidate });
    if (!exists) return candidate;
  }
  return `${generateReferenceId()}-${Date.now().toString().slice(-3)}`;
}

export async function createGrievance(req, res, next) {
  try {
    const parsed = createGrievanceSchema.parse(req.body);

    let aiPayload = null;
    if (parsed.aiAnalysis) {
      try {
        aiPayload =
          typeof parsed.aiAnalysis === 'string'
            ? JSON.parse(parsed.aiAnalysis)
            : parsed.aiAnalysis;
      } catch {
        aiPayload = null;
      }
    }

    if (!aiPayload) {
      const [departments, recentGrievances] = await Promise.all([
        Department.find({ isActive: true }).select('name code').lean(),
        Grievance.find({})
          .sort({ createdAt: -1 })
          .limit(50)
          .select('referenceId subject description district status')
          .lean()
      ]);
      aiPayload = await analyzeGrievance({
        subject: parsed.subject,
        description: parsed.description,
        district: parsed.district,
        category: parsed.category,
        departments,
        existingGrievances: recentGrievances
      });
    }

    const referenceId = await allocateUniqueReferenceId();
    const dueDate = computeDueDate(parsed.priority);

    const grievance = await Grievance.create({
      referenceId,
      citizenId: req.user._id,
      district: parsed.district,
      category: parsed.category,
      subject: parsed.subject,
      description: parsed.description,
      priority: parsed.priority,
      status: 'Submitted',
      workflowStage: 'Submitted to CMO',
      dueDate,
      aiAnalysis: {
        suggestedDepartmentCode: aiPayload.suggestedDepartmentCode || '',
        suggestedDepartmentName: aiPayload.suggestedDepartmentName || '',
        suggestedCategory: aiPayload.suggestedCategory || '',
        recommendedPriority: GRIEVANCE_PRIORITIES.includes(aiPayload.recommendedPriority)
          ? aiPayload.recommendedPriority
          : '',
        summary: aiPayload.summary || '',
        reasoning: aiPayload.reasoning || '',
        potentialDuplicates: Array.isArray(aiPayload.potentialDuplicates)
          ? aiPayload.potentialDuplicates.slice(0, 3)
          : [],
        source: ['gemini', 'fallback'].includes(aiPayload.source) ? aiPayload.source : 'fallback',
        model: aiPayload.model || '',
        isFallback: Boolean(aiPayload.isFallback),
        fallbackReason: aiPayload.fallbackReason || '',
        citizenAccepted: Boolean(aiPayload.citizenAccepted),
        cmoReviewed: false,
        analyzedAt: aiPayload.analyzedAt ? new Date(aiPayload.analyzedAt) : new Date()
      }
    });

    if (req.file) {
      await createAttachmentRecord({
        file: req.file,
        grievanceId: grievance._id,
        user: req.user,
        attachmentType: 'supporting_evidence'
      });
    }

    await recordHistory({
      grievanceId: grievance._id,
      previousStatus: null,
      newStatus: 'Submitted',
      workflowStage: 'Submitted to CMO',
      actionType: 'SUBMITTED',
      remarks: 'Grievance submitted by citizen to the Chief Minister Office portal.',
      isInternal: false,
      user: req.user
    });

    const bundle = await getGrievanceBundle(grievance, USER_ROLES.CITIZEN);
    return res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully.',
      referenceId: grievance.referenceId,
      grievance: bundle
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMyGrievances(req, res, next) {
  try {
    const { status, search } = req.query;
    const filter = { citizenId: req.user._id };

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ referenceId: regex }, { subject: regex }, { district: regex }];
    }

    const [grievances, allCitizenGrievances] = await Promise.all([
      Grievance.find(filter)
        .populate('assignedDepartmentId', 'name code')
        .sort({ createdAt: -1 })
        .lean(),
      Grievance.find({ citizenId: req.user._id }).select('status dueDate').lean()
    ]);

    const summary = {
      total: allCitizenGrievances.length,
      pending: allCitizenGrievances.filter((g) => g.status !== 'Resolved').length,
      resolved: allCitizenGrievances.filter((g) => g.status === 'Resolved').length
    };

    return res.json({
      success: true,
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

export async function getCitizenGrievanceById(req, res, next) {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate('assignedDepartmentId', 'name code description')
      .populate('assignedOfficerId', 'name designation');

    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }

    if (!grievance.citizenId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are only permitted to view your own grievances.'
      });
    }

    const bundle = await getGrievanceBundle(grievance, USER_ROLES.CITIZEN);
    return res.json({ success: true, grievance: bundle });
  } catch (error) {
    return next(error);
  }
}

export async function trackGrievanceByReference(req, res, next) {
  try {
    const ref = String(req.params.referenceId || '').trim().toUpperCase();
    const grievance = await Grievance.findOne({ referenceId: ref })
      .populate('assignedDepartmentId', 'name code')
      .lean();

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: `No grievance found for reference ID "${ref}".`
      });
    }

    const [publicHistory, feedback] = await Promise.all([
      GrievanceHistory.find({ grievanceId: grievance._id, isInternal: false })
        .select('previousStatus newStatus workflowStage actionType remarks changedByRole createdAt')
        .sort({ createdAt: 1 })
        .lean(),
      CitizenFeedback.findOne({ grievanceId: grievance._id })
        .select('rating isSatisfied createdAt')
        .lean()
    ]);

    return res.json({
      success: true,
      grievance: {
        referenceId: grievance.referenceId,
        district: grievance.district,
        category: grievance.category,
        subject: grievance.subject,
        priority: grievance.priority,
        status: grievance.status,
        workflowStage: grievance.workflowStage,
        assignedDepartment: grievance.assignedDepartmentId || null,
        isEscalated: grievance.isEscalated,
        isOverdue: isGrievanceOverdue(grievance),
        dueDate: grievance.dueDate,
        actionTakenReport:
          grievance.status === 'Resolved' || grievance.atrSubmitted
            ? grievance.actionTakenReport
            : '',
        resolvedAt: grievance.resolvedAt,
        createdAt: grievance.createdAt,
        updatedAt: grievance.updatedAt,
        history: publicHistory,
        feedback: feedback || null
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function submitCitizenFeedback(req, res, next) {
  try {
    const data = feedbackSchema.parse(req.body);
    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }
    if (!grievance.citizenId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit feedback for your own grievance.'
      });
    }
    if (grievance.status !== 'Resolved') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted after the grievance is Resolved.'
      });
    }

    const feedback = await CitizenFeedback.findOneAndUpdate(
      { grievanceId: grievance._id },
      {
        grievanceId: grievance._id,
        citizenId: req.user._id,
        rating: data.rating,
        isSatisfied: data.isSatisfied,
        comment: data.comment
      },
      { upsert: true, new: true, runValidators: true }
    );

    await recordHistory({
      grievanceId: grievance._id,
      previousStatus: grievance.status,
      newStatus: grievance.status,
      workflowStage: grievance.workflowStage,
      actionType: 'FEEDBACK_ADDED',
      remarks: `Citizen submitted feedback (${data.rating}/5 stars). ${
        data.comment ? `"${data.comment}"` : ''
      }`.trim(),
      isInternal: false,
      user: req.user
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for your feedback.',
      feedback
    });
  } catch (error) {
    return next(error);
  }
}

export async function reopenGrievance(req, res, next) {
  try {
    const data = reopenSchema.parse(req.body);
    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }
    if (!grievance.citizenId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You can only reopen your own grievance.'
      });
    }
    if (grievance.status !== 'Resolved') {
      return res.status(400).json({
        success: false,
        message: 'Only a Resolved grievance can be reopened.'
      });
    }

    const previousStatus = grievance.status;
    grievance.status = 'Reopened';
    grievance.workflowStage = 'Reopened by Citizen';
    grievance.reopenedCount = (grievance.reopenedCount || 0) + 1;
    grievance.resolvedAt = null;
    grievance.atrSubmitted = false;
    grievance.dueDate = computeDueDate('High');
    await grievance.save();

    await recordHistory({
      grievanceId: grievance._id,
      previousStatus,
      newStatus: 'Reopened',
      workflowStage: 'Reopened by Citizen',
      actionType: 'REOPENED',
      remarks: `Reopened by citizen: ${data.reason}`,
      isInternal: false,
      user: req.user
    });

    const bundle = await getGrievanceBundle(grievance, USER_ROLES.CITIZEN);
    return res.json({
      success: true,
      message: 'Grievance reopened and routed back to the CMO for review.',
      grievance: bundle
    });
  } catch (error) {
    return next(error);
  }
}
