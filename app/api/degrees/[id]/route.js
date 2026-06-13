/**
 * /api/degrees/[id]
 * GET, PATCH, DELETE
 */
import connectDB from '@/lib/db';
import Degree from '@/models/Degree';
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
    const degree = await Degree.findById(id);
    if (!degree) return notFoundResponse('Degree not found');
    return successResponse(degree);
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

    const degree = await Degree.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!degree) return notFoundResponse('Degree not found');
    return successResponse(degree, 'Degree updated successfully');
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    if (error.code === 11000) return errorResponse('Degree name already exists', 400);
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const decoded = await authenticateRequest(request);
    if (decoded.role !== 'super_admin') return forbiddenResponse('Only Super Admin can delete degrees');

    await connectDB();
    const { id } = await params;
    const degree = await Degree.findByIdAndDelete(id);
    if (!degree) return notFoundResponse('Degree not found');
    return successResponse(null, 'Degree deleted successfully');
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}
