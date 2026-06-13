/**
 * /api/fees
 * GET - List fees
 * POST - Create fee record
 */
import connectDB from '@/lib/db';
import Fee from '@/models/Fee';
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
    const student = searchParams.get('student');
    const status = searchParams.get('status');
    const academicYear = searchParams.get('academicYear');

    const query = {};
    if (student) query.student = student;
    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;

    const fees = await Fee.find(query)
      .populate({
        path: 'student',
        select: 'fullName enrollmentNumber degree course department',
        populate: [
          { path: 'degree', select: 'name shortName' },
          { path: 'course', select: 'name code' },
          { path: 'department', select: 'name shortName' },
        ],
      })
      .sort({ yearNumber: 1, createdAt: -1 });

    return successResponse(fees);
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

    // Check for duplicate fee record
    const existing = await Fee.findOne({
      student: body.student,
      academicYear: body.academicYear,
      yearNumber: body.yearNumber,
    });

    if (existing) {
      return errorResponse(
        `Fee record already exists for year ${body.yearNumber} in academic year ${body.academicYear}`,
        400
      );
    }

    const fee = await Fee.create({ ...body, createdBy: decoded.userId });

    return successResponse(fee, 'Fee record created successfully', 201);
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return errorResponse(errors[0], 400);
    }
    return errorResponse(error.message, 500);
  }
}
