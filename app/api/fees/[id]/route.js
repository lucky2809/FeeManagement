/**
 * /api/fees/[id]
 */
import connectDB from '@/lib/db';
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
    const fee = await Fee.findById(id).populate('student', 'fullName enrollmentNumber');
    if (!fee) return notFoundResponse('Fee record not found');
    return successResponse(fee);
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const decoded = await authenticateRequest(request);
    if (!['super_admin', 'admin'].includes(decoded.role)) return forbiddenResponse();

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const fee = await Fee.findById(id);
    if (!fee) return notFoundResponse('Fee record not found');

    // Update fields
    Object.assign(fee, { ...body, updatedBy: decoded.userId });
    await fee.save();

    return successResponse(fee, 'Fee record updated successfully');
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const decoded = await authenticateRequest(request);
    if (decoded.role !== 'super_admin') return forbiddenResponse();

    await connectDB();
    const { id } = await params;
    const fee = await Fee.findByIdAndDelete(id);
    if (!fee) return notFoundResponse('Fee record not found');
    return successResponse(null, 'Fee record deleted successfully');
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}
