import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    grievanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      required: true,
      index: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedByRole: {
      type: String,
      required: true
    },
    attachmentType: {
      type: String,
      enum: ['supporting_evidence', 'action_taken_report'],
      default: 'supporting_evidence'
    },
    originalName: {
      type: String,
      required: true
    },
    storedName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    sizeBytes: {
      type: Number,
      required: true
    },
    storagePath: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export const Attachment = mongoose.model('Attachment', attachmentSchema);
