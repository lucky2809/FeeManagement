/**
 * /api/departments/[id]
 */
import connectDB from '@/lib/db';
import Department from '@/models/Department';
import { authenticateRequest } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from '@/lib/apiResponse';

export async function PATCH(request, { params }) {
  try {
    const decoded = await authenticateRequest(request);
    if (!['super_admin', 'admin'].includes(decoded.role)) return forbiddenResponse();

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const department = await Department.findByIdAndUpdate(id, body, { new: true, runValidators: true })
      .populate('degree', 'name shortName');

    if (!department) return notFoundResponse('Department not found');
    return successResponse(department, 'Department updated successfully');
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
    const dept = await Department.findByIdAndDelete(id);
    if (!dept) return notFoundResponse('Department not found');
    return successResponse(null, 'Department deleted successfully');
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}
