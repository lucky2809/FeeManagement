/**
 * Course Model - represents a specific course under a degree+department
 */
import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      maxlength: [100, 'Course name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Course code cannot exceed 20 characters'],
    },
    degree: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Degree',
      required: [true, 'Degree is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    totalFeePerYear: {
      type: Number,
      required: [true, 'Total fee per year is required'],
      min: [0, 'Fee cannot be negative'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 year'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

CourseSchema.index({ degree: 1, department: 1 });
CourseSchema.index({ code: 1 });

export default mongoose.models.Course || mongoose.model('Course', CourseSchema);
