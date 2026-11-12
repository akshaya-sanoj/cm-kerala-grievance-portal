import mongoose from 'mongoose';
import { z } from 'zod';
import { CitizenFeedback } from '../models/CitizenFeedback.js';
import { ContactEnquiry } from '../models/ContactEnquiry.js';
import { Department } from '../models/Department.js';
import { Grievance } from '../models/Grievance.js';
import { analyzeGrievance } from '../services/aiService.js';
import {
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_PRIORITIES,
  GRIEVANCE_STATUSES,
  KERALA_DISTRICTS
} from '../utils/constants.js';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120),
  email: z.string().trim().email('Valid email is required').toLowerCase(),
  subject: z.string().trim().min(3, 'Subject is required').max(200),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(3000)
});

const publicAiPreviewSchema = z.object({
  description: z.string().trim().min(15, 'Enter at least 15 characters to test AI triage').max(800),
  district: z.string().trim().optional().default('')
});

export function getHealth(_req, res) {
  const dbReady = mongoose.connection.readyState === 1;
  res.json({
    success: true,
    status: 'ok',
    prototype: true,
    databaseConnected: dbReady,
    timestamp: new Date().toISOString()
  });
}

export async function getPublicStats(_req, res, next) {
  try {
    const [statusCounts, departmentCount, feedbackAgg, recentPublicFeed] = await Promise.all([
      Grievance.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Department.countDocuments({ isActive: true }),
      CitizenFeedback.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]),
      Grievance.find({})
        .select('referenceId district category subject status priority updatedAt')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean()
    ]);

    const countsByStatus = Object.fromEntries(
      statusCounts.map((item) => [item._id, item.count])
    );

    const submitted = countsByStatus.Submitted || 0;
    const underReview = countsByStatus['Under Review'] || 0;
    const inProgress = countsByStatus['In Progress'] || 0;
    const resolved = countsByStatus.Resolved || 0;
    const reopened = countsByStatus.Reopened || 0;
    const total = submitted + underReview + inProgress + resolved + reopened;

    return res.json({
      success: true,
      stats: {
        totalGrievances: total,
        resolvedGrievances: resolved,
        inProgressGrievances: underReview + inProgress + reopened,
        submittedGrievances: submitted,
        activeDepartments: departmentCount,
        averageRating: feedbackAgg[0]?.avgRating
          ? Number(feedbackAgg[0].avgRating.toFixed(1))
          : 4.5,
        feedbackCount: feedbackAgg[0]?.count || 0
      },
      recentPublicFeed
    });
  } catch (error) {
    return next(error);
  }
}

export async function getDepartments(_req, res, next) {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 }).lean();
    return res.json({
      success: true,
      departments
    });
  } catch (error) {
    return next(error);
  }
}

export function getMetadata(_req, res) {
  res.json({
    success: true,
    metadata: {
      districts: KERALA_DISTRICTS,
      categories: GRIEVANCE_CATEGORIES,
      statuses: GRIEVANCE_STATUSES,
      priorities: GRIEVANCE_PRIORITIES
    }
  });
}

export async function submitContactEnquiry(req, res, next) {
  try {
    const data = contactSchema.parse(req.body);
    const enquiry = await ContactEnquiry.create(data);
    return res.status(201).json({
      success: true,
      message: 'Your enquiry has been recorded. Thank you for contacting the portal.',
      enquiry: {
        id: enquiry._id,
        name: enquiry.name,
        email: enquiry.email,
        subject: enquiry.subject,
        createdAt: enquiry.createdAt
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function runPublicAiPreview(req, res, next) {
  try {
    const data = publicAiPreviewSchema.parse(req.body);
    const departments = await Department.find({ isActive: true }).select('name code').lean();
    const analysis = await analyzeGrievance({
      description: data.description,
      district: data.district,
      departments,
      existingGrievances: []
    });

    return res.json({
      success: true,
      preview: {
        suggestedDepartmentCode: analysis.suggestedDepartmentCode,
        suggestedDepartmentName: analysis.suggestedDepartmentName,
        suggestedCategory: analysis.suggestedCategory,
        recommendedPriority: analysis.recommendedPriority,
        summary: analysis.summary,
        source: analysis.source,
        model: analysis.model,
        isFallback: analysis.isFallback
      }
    });
  } catch (error) {
    return next(error);
  }
}
