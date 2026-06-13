/**
 * /api/courses/[id]
 */
import connectDB from '@/lib/db';
import Course from '@/models/Course';
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
    const course = await Course.findById(id)
      .populate('degree', 'name shortName')
      .populate('department', 'name shortName');
    if (!course) return notFoundResponse('Course not found');
    return successResponse(course);
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

    const course = await Course.findByIdAndUpdate(id, body, { new: true, runValidators: true })
      .populate('degree', 'name shortName')
      .populate('department', 'name shortName');

    if (!course) return notFoundResponse('Course not found');
    return successResponse(course, 'Course updated successfully');
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    if (error.code === 11000) return errorResponse('Course code already exists', 400);
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const decoded = await authenticateRequest(request);
    if (decoded.role !== 'super_admin') return forbiddenResponse();

    await connectDB();
    const { id } = await params;
    const course = await Course.findByIdAndDelete(id);
    if (!course) return notFoundResponse('Course not found');
    return successResponse(null, 'Course deleted successfully');
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}
