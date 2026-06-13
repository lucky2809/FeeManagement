/**
 * /api/payments/[id]
 */
import connectDB from '@/lib/db';
import Payment from '@/models/Payment';
import Fee from '@/models/Fee';
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
    await authenticateRequest(request);
    await connectDB();
    const { id } = await params;
    const payment = await Payment.findById(id)
      .populate('student', 'fullName enrollmentNumber fatherName mobileNumber course degree department')
      .populate('fee', 'academicYear yearNumber totalFee paidAmount discount fineAmount')
      .populate('collectedBy', 'name email');
    if (!payment) return notFoundResponse('Payment not found');
    return successResponse(payment);
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const decoded = await authenticateRequest(request);
    if (decoded.role !== 'super_admin') return forbiddenResponse('Only Super Admin can delete payments');

    await connectDB();
    const { id } = await params;
    const payment = await Payment.findById(id);
    if (!payment) return notFoundResponse('Payment not found');

    // Reverse fee update
    const feeRecord = await Fee.findById(payment.fee);
    if (feeRecord) {
      feeRecord.paidAmount = Math.max(0, feeRecord.paidAmount - payment.amount);
      await feeRecord.save();
    }

    await Payment.findByIdAndDelete(id);
    return successResponse(null, 'Payment deleted and fee balance reversed');
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}
