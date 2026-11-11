import mongoose from 'mongoose';

const contactEnquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000
    },
    status: {
      type: String,
      enum: ['New', 'Reviewed', 'Responded'],
      default: 'New'
    }
  },
  { timestamps: true }
);

export const ContactEnquiry = mongoose.model('ContactEnquiry', contactEnquirySchema);
