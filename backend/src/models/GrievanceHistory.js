import mongoose from 'mongoose';
import { GRIEVANCE_STATUSES } from '../utils/constants.js';

const grievanceHistorySchema = new mongoose.Schema(
  {
    grievanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      required: true,
      index: true
    },
    previousStatus: {
      type: String,
      enum: [...GRIEVANCE_STATUSES, null],
      default: null
    },
    newStatus: {
      type: String,
      enum: GRIEVANCE_STATUSES,
      required: true
    },
    workflowStage: {
      type: String,
      required: true
    },
    actionType: {
      type: String,
      enum: [
        'SUBMITTED',
        'CMO_REVIEW',
        'ASSIGNED',
        'OFFICER_UPDATE',
        'ATR_SUBMITTED',
        'REMARK_ADDED',
        'ESCALATED',
        'RESOLVED',
        'REOPENED',
        'FEEDBACK_ADDED'
      ],
      required: true
    },
    remarks: {
      type: String,
      required: true,
      trim: true
    },
    isInternal: {
      type: Boolean,
      default: false
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedByName: {
      type: String,
      required: true
    },
    changedByRole: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

grievanceHistorySchema.index({ grievanceId: 1, createdAt: 1 });

export const GrievanceHistory = mongoose.model('GrievanceHistory', grievanceHistorySchema);
