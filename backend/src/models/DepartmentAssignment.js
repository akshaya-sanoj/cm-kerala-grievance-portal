import mongoose from 'mongoose';

const departmentAssignmentSchema = new mongoose.Schema(
  {
    grievanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      required: true,
      index: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true
    },
    officerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    instructions: {
      type: String,
      trim: true,
      default: ''
    },
    dueDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Reassigned'],
      default: 'Active'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export const DepartmentAssignment = mongoose.model(
  'DepartmentAssignment',
  departmentAssignmentSchema
);
