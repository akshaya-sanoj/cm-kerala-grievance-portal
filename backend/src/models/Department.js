import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    headDesignation: {
      type: String,
      default: 'Nodal Grievance Officer'
    },
    slaDays: {
      type: Number,
      default: 7,
      min: 1
    },
    categories: {
      type: [String],
      default: []
    },
    contactEmail: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const Department = mongoose.model('Department', departmentSchema);
