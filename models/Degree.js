/**
 * Degree Model (e.g., B.Tech, BCA, MBA)
 */
import mongoose from 'mongoose';

const DegreeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Degree name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Degree name cannot exceed 100 characters'],
    },
    shortName: {
      type: String,
      required: [true, 'Short name is required'],
      trim: true,
      uppercase: true,
      maxlength: [20, 'Short name cannot exceed 20 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 year'],
      max: [10, 'Duration cannot exceed 10 years'],
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

DegreeSchema.index({ name: 1 });

export default mongoose.models.Degree || mongoose.model('Degree', DegreeSchema);
