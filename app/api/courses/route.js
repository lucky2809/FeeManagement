/**
 * /api/courses
 */
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import { authenticateRequest } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/apiResponse';

export async function GET(request) {
  try {
    await authenticateRequest(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const degree = searchParams.get('degree');
    const department = searchParams.get('department');
    const active = searchParams.get('active');

    const query = {};
    if (degree) query.degree = degree;
    if (department) query.department = department;
    if (active === 'true') query.isActive = true;

    const courses = await Course.find(query)
      .populate('degree', 'name shortName')
      .populate('department', 'name shortName')
      .sort({ name: 1 });

    return successResponse(courses);
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}

export async function POST(request) {
  try {
    const decoded = await authenticateRequest(request);
    if (!['super_admin', 'admin'].includes(decoded.role)) return forbiddenResponse();

    await connectDB();
    const body = await request.json();

    const course = await Course.create({ ...body, createdBy: decoded.userId });
    const populated = await Course.findById(course._id)
      .populate('degree', 'name shortName')
      .populate('department', 'name shortName');

    return successResponse(populated, 'Course created successfully', 201);
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    if (error.code === 11000) return errorResponse('Course code already exists', 400);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return errorResponse(errors[0], 400);
    }
    return errorResponse(error.message, 500);
  }
}
