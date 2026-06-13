/**
 * /api/departments
 */
import connectDB from '@/lib/db';
import Department from '@/models/Department';
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
    const active = searchParams.get('active');

    const query = {};
    if (degree) query.degree = degree;
    if (active === 'true') query.isActive = true;

    const departments = await Department.find(query)
      .populate('degree', 'name shortName')
      .sort({ name: 1 });

    return successResponse(departments);
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

    const department = await Department.create({ ...body, createdBy: decoded.userId });
    const populated = await Department.findById(department._id).populate('degree', 'name shortName');

    return successResponse(populated, 'Department created successfully', 201);
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    if (error.code === 11000) return errorResponse('Department already exists for this degree', 400);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return errorResponse(errors[0], 400);
    }
    return errorResponse(error.message, 500);
  }
}
