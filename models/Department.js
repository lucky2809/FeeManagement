/**
 * Department Model (e.g., Computer Science, Mechanical)
 */
import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters'],
    },
    shortName: {
      type: String,
      required: [true, 'Short name is required'],
      trim: true,
      uppercase: true,
      maxlength: [20, 'Short name cannot exceed 20 characters'],
    },
    degree: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Degree',
      required: [true, 'Degree is required'],
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

// Compound unique index: same dept name can exist in different degrees
DepartmentSchema.index({ name: 1, degree: 1 }, { unique: true });

export default mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
