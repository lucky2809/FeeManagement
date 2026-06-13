/**
 * Payment Model - individual payment transactions
 */
import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    fee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fee',
      required: [true, 'Fee record is required'],
    },
    receiptNumber: {
      type: String,
      required: [true, 'Receipt number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Amount must be at least 1'],
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
      default: Date.now,
    },
    paymentMode: {
      type: String,
      required: [true, 'Payment mode is required'],
      enum: ['Cash', 'Online', 'Cheque', 'DD', 'NEFT', 'UPI', 'Card'],
    },
    transactionId: {
      type: String,
      trim: true,
      default: null,
    },
    chequeNumber: {
      type: String,
      trim: true,
      default: null,
    },
    bankName: {
      type: String,
      trim: true,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [300, 'Remarks cannot exceed 300 characters'],
      default: null,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PaymentSchema.index({ student: 1, paymentDate: -1 });
PaymentSchema.index({ receiptNumber: 1 }, { unique: true });
PaymentSchema.index({ fee: 1 });
PaymentSchema.index({ paymentDate: 1 });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
