import { z } from 'zod';
import { Department } from '../models/Department.js';
import { Grievance } from '../models/Grievance.js';
import { analyzeGrievance } from '../services/aiService.js';

const analyzeRequestSchema = z.object({
  subject: z.string().trim().max(200).optional().default(''),
  description: z
    .string()
    .trim()
    .min(10, 'Please enter at least 10 characters in the grievance description for AI analysis.')
    .max(5000),
  district: z.string().trim().optional().default(''),
  category: z.string().trim().optional().default(''),
  excludeReferenceId: z.string().trim().optional().default('')
});

export async function analyzeGrievanceText(req, res, next) {
  try {
    const data = analyzeRequestSchema.parse(req.body);

    const [departments, recentGrievances] = await Promise.all([
      Department.find({ isActive: true }).select('name code').lean(),
      Grievance.find(
        data.excludeReferenceId
          ? { referenceId: { $ne: data.excludeReferenceId } }
          : {}
      )
        .sort({ createdAt: -1 })
        .limit(60)
        .select('referenceId subject description district status')
        .lean()
    ]);

    const analysis = await analyzeGrievance({
      subject: data.subject,
      description: data.description,
      district: data.district,
      category: data.category,
      departments,
      existingGrievances: recentGrievances
    });

    return res.json({
      success: true,
      advisoryNotice:
        'AI suggestions are advisory only and must be reviewed by the citizen or CMO administrator before official decisions.',
      analysis
    });
  } catch (error) {
    return next(error);
  }
}
