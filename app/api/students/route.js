/**
 * /api/students
 * GET - List students with filtering, sorting, pagination
 * POST - Create new student
 */
import connectDB from '@/lib/db';
import Student from '@/models/Student';
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const degree = searchParams.get('degree') || '';
    const course = searchParams.get('course') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';
    const admissionYear = searchParams.get('admissionYear') || '';
    const currentYear = searchParams.get('currentYear') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { enrollmentNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const gender = searchParams.get('gender') || '';

    if (degree) query.degree = degree;
    if (course) query.course = course;
    if (department) query.department = department;
    if (status) query.status = status;
    if (admissionYear) query.admissionYear = parseInt(admissionYear);
    if (currentYear) query.currentYear = parseInt(currentYear);
    if (gender) query.gender = gender;

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate('degree', 'name shortName')
      .populate('course', 'name code')
      .populate('department', 'name shortName')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    return successResponse({
      students,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}

export async function POST(request) {
  try {
    const decoded = await authenticateRequest(request);

    if (!['super_admin', 'admin'].includes(decoded.role)) {
      return forbiddenResponse();
    }

    await connectDB();

    const body = await request.json();

    // Check enrollment number uniqueness
    if (body.enrollmentNumber) {
      const existing = await Student.findOne({
        enrollmentNumber: body.enrollmentNumber.toUpperCase(),
      });
      if (existing) {
        return errorResponse('Enrollment number already exists', 400);
      }
    }

    const student = await Student.create({
      ...body,
      addedBy: decoded.userId,
    });

    const populated = await Student.findById(student._id)
      .populate('degree', 'name shortName')
      .populate('course', 'name code')
      .populate('department', 'name shortName');

    return successResponse(populated, 'Student created successfully', 201);
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return errorResponse(errors[0], 400);
    }
    return errorResponse(error.message, 500);
  }
}
