/**
 * /api/degrees
 * GET - List all degrees
 * POST - Create degree
 */
import connectDB from '@/lib/db';
import Degree from '@/models/Degree';
import { authenticateRequest } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/apiResponse';

export async function GET(request) {
  try {
    const decoded = await authenticateRequest(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    const query = {};
    if (active === 'true') query.isActive = true;

    const degrees = await Degree.find(query).sort({ name: 1 });
    return successResponse(degrees);
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

    const degree = await Degree.create({ ...body, createdBy: decoded.userId });
    return successResponse(degree, 'Degree created successfully', 201);
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    if (error.code === 11000) return errorResponse('Degree name already exists', 400);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return errorResponse(errors[0], 400);
    }
    return errorResponse(error.message, 500);
  }
}
