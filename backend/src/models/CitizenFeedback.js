import mongoose from 'mongoose';

const citizenFeedbackSchema = new mongoose.Schema(
  {
    grievanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      required: true,
      unique: true
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    isSatisfied: {
      type: Boolean,
      default: true
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: ''
    }
  },
  { timestamps: true }
);

export const CitizenFeedback = mongoose.model('CitizenFeedback', citizenFeedbackSchema);
