/**
 * Student Model - comprehensive student record
 */
import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema(
  {
    // Personal Information
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    fatherName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    motherName: {
      type: String,
      required: [true, "Mother's name is required"],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
      default: null,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [100, 'State name cannot exceed 100 characters'],
    },
    profileImage: {
      type: String,
      default: null,
    },

    // Academic Information
    enrollmentNumber: {
      type: String,
      required: [true, 'Enrollment number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    registrationNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    degree: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Degree',
      required: [true, 'Degree is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    admissionYear: {
      type: Number,
      required: [true, 'Admission year is required'],
      min: [2000, 'Invalid admission year'],
      max: [new Date().getFullYear() + 1, 'Invalid admission year'],
    },
    currentYear: {
      type: Number,
      required: [true, 'Current year is required'],
      min: [1, 'Year must be at least 1'],
    },
    currentSemester: {
      type: Number,
      min: [1, 'Semester must be at least 1'],
      default: 1,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Graduated', 'Dropped', 'Suspended'],
      default: 'Active',
    },

    // Metadata
    addedBy: {
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
  }
);

// Indexes for common queries
StudentSchema.index({ enrollmentNumber: 1 }, { unique: true });
StudentSchema.index({ degree: 1, course: 1, department: 1 });
StudentSchema.index({ admissionYear: 1 });
StudentSchema.index({ status: 1 });
StudentSchema.index({ fullName: 'text', enrollmentNumber: 'text', email: 'text' });

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);
