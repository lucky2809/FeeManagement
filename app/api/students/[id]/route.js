/**
 * /api/students/[id]
 * GET - Get student by ID (with fee summary)
 * PATCH - Update student
 * DELETE - Delete student (super_admin, admin only)
 */
import connectDB from '@/lib/db';
import Student from '@/models/Student';
import Fee from '@/models/Fee';
import Payment from '@/models/Payment';
import { authenticateRequest } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from '@/lib/apiResponse';

export async function GET(request, { params }) {
  try {
    const decoded = await authenticateRequest(request);
    await connectDB();

    const { id } = await params;
    const student = await Student.findById(id)
      .populate('degree', 'name shortName duration')
      .populate('course', 'name code totalFeePerYear duration')
      .populate('department', 'name shortName')
      .populate('addedBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!student) return notFoundResponse('Student not found');

    // Get fee records
    const fees = await Fee.find({ student: id }).sort({ yearNumber: 1 });

    // Get payment history
    const payments = await Payment.find({ student: id })
      .sort({ paymentDate: -1 })
      .populate('collectedBy', 'name email');

    // Calculate totals
    const totalFee = fees.reduce((sum, f) => sum + f.totalFee, 0);
    const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
    const totalRemaining = fees.reduce((sum, f) => sum + (f.totalFee - f.discount + f.fineAmount - f.paidAmount), 0);

    return successResponse({
      student,
      fees,
      payments,
      feeSummary: {
        totalFee,
        totalPaid,
        totalRemaining: Math.max(0, totalRemaining),
        paymentCount: payments.length,
      },
    });
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const decoded = await authenticateRequest(request);

    if (!['super_admin', 'admin'].includes(decoded.role)) {
      return forbiddenResponse();
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    // Check enrollment number uniqueness if being updated
    if (body.enrollmentNumber) {
      const existing = await Student.findOne({
        enrollmentNumber: body.enrollmentNumber.toUpperCase(),
        _id: { $ne: id },
      });
      if (existing) return errorResponse('Enrollment number already in use', 400);
    }

    const student = await Student.findByIdAndUpdate(
      id,
      { ...body, updatedBy: decoded.userId },
      { new: true, runValidators: true }
    )
      .populate('degree', 'name shortName')
      .populate('course', 'name code')
      .populate('department', 'name shortName');

    if (!student) return notFoundResponse('Student not found');

    return successResponse(student, 'Student updated successfully');
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return errorResponse(errors[0], 400);
    }
    return errorResponse(error.message, 500);
  }
}

export { PATCH as PUT };

export async function DELETE(request, { params }) {
  try {
    const decoded = await authenticateRequest(request);

    if (!['super_admin', 'admin'].includes(decoded.role)) {
      return forbiddenResponse();
    }

    await connectDB();
    const { id } = await params;
    const student = await Student.findById(id);
    if (!student) return notFoundResponse('Student not found');

    // Delete associated fee and payment records
    await Fee.deleteMany({ student: id });
    await Payment.deleteMany({ student: id });
    await Student.findByIdAndDelete(id);

    return successResponse(null, 'Student and all associated records deleted successfully');
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}
