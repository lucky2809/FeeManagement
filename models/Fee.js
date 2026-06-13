/**
 * Fee Model - tracks fee structure per student per year
 */
import mongoose from 'mongoose';

const FeeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      // Format: "2023-24"
      match: [/^\d{4}-\d{2,4}$/, 'Academic year format should be YYYY-YY'],
    },
    yearNumber: {
      type: Number,
      required: [true, 'Year number is required'],
      min: [1, 'Year must be at least 1'],
    },
    totalFee: {
      type: Number,
      required: [true, 'Total fee is required'],
      min: [0, 'Fee cannot be negative'],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: [0, 'Fine cannot be negative'],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'Partial', 'Paid', 'Overdue'],
      default: 'Pending',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: remaining amount
FeeSchema.virtual('remainingAmount').get(function () {
  const effective = this.totalFee - this.discount + this.fineAmount;
  return Math.max(0, effective - this.paidAmount);
});

// Auto-update status based on amounts
FeeSchema.pre('save', function (next) {
  const effective = this.totalFee - this.discount + this.fineAmount;
  const remaining = effective - this.paidAmount;

  if (remaining <= 0) {
    this.status = 'Paid';
  } else if (this.paidAmount > 0) {
    this.status = 'Partial';
  } else if (this.dueDate && new Date() > this.dueDate) {
    this.status = 'Overdue';
  } else {
    this.status = 'Pending';
  }

  next();
});

// Unique per student per academic year per year number
FeeSchema.index({ student: 1, academicYear: 1, yearNumber: 1 }, { unique: true });
FeeSchema.index({ status: 1 });
FeeSchema.index({ student: 1 });

export default mongoose.models.Fee || mongoose.model('Fee', FeeSchema);
