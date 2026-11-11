import mongoose from 'mongoose';
import {
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_PRIORITIES,
  GRIEVANCE_STATUSES,
  KERALA_DISTRICTS
} from '../utils/constants.js';

const potentialDuplicateSchema = new mongoose.Schema(
  {
    referenceId: { type: String, required: true },
    subject: { type: String, required: true },
    status: { type: String, required: true },
    similarityScore: { type: Number, required: true }
  },
  { _id: false }
);

const aiAnalysisSchema = new mongoose.Schema(
  {
    suggestedDepartmentCode: { type: String, default: '' },
    suggestedDepartmentName: { type: String, default: '' },
    suggestedCategory: { type: String, default: '' },
    recommendedPriority: { type: String, enum: [...GRIEVANCE_PRIORITIES, ''], default: '' },
    summary: { type: String, default: '' },
    reasoning: { type: String, default: '' },
    potentialDuplicates: { type: [potentialDuplicateSchema], default: [] },
    source: { type: String, enum: ['gemini', 'fallback', 'none'], default: 'none' },
    model: { type: String, default: '' },
    isFallback: { type: Boolean, default: false },
    fallbackReason: { type: String, default: '' },
    citizenAccepted: { type: Boolean, default: false },
    cmoReviewed: { type: Boolean, default: false },
    analyzedAt: { type: Date, default: null }
  },
  { _id: false }
);

const grievanceSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    district: {
      type: String,
      required: true,
      enum: KERALA_DISTRICTS,
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: GRIEVANCE_CATEGORIES,
      index: true
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    priority: {
      type: String,
      enum: GRIEVANCE_PRIORITIES,
      default: 'Medium',
      index: true
    },
    status: {
      type: String,
      enum: GRIEVANCE_STATUSES,
      default: 'Submitted',
      index: true
    },
    workflowStage: {
      type: String,
      default: 'Submitted to CMO'
    },
    assignedDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true
    },
    assignedOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    isEscalated: {
      type: Boolean,
      default: false,
      index: true
    },
    escalationReason: {
      type: String,
      default: ''
    },
    escalatedAt: {
      type: Date,
      default: null
    },
    escalatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    actionTakenReport: {
      type: String,
      default: ''
    },
    atrSubmitted: {
      type: Boolean,
      default: false
    },
    atrSubmittedAt: {
      type: Date,
      default: null
    },
    atrSubmittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    reopenedCount: {
      type: Number,
      default: 0
    },
    aiAnalysis: {
      type: aiAnalysisSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

grievanceSchema.index({ createdAt: -1 });
grievanceSchema.index({ status: 1, dueDate: 1 });

export const Grievance = mongoose.model('Grievance', grievanceSchema);
