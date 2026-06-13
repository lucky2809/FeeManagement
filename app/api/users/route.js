/**
 * /api/users
 * GET - List all users (super_admin, admin only)
 * POST - Create new user (super_admin, admin only - admin cannot create super_admin)
 */
import connectDB from '@/lib/db';
import User from '@/models/User';
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

    if (!['super_admin', 'admin'].includes(decoded.role)) {
      return forbiddenResponse();
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name email');

    return successResponse({
      users,
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
    const { name, email, password, role } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return errorResponse('Name, email, password, and role are required', 400);
    }

    // Admin cannot create super_admin
    if (decoded.role === 'admin' && role === 'super_admin') {
      return forbiddenResponse('Admin cannot create Super Admin accounts');
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(password)) {
      return errorResponse(
        'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
        400
      );
    }

    // Check email uniqueness
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return errorResponse('Email already in use', 400);
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      createdBy: decoded.userId,
    });

    return successResponse(user.toSafeObject(), 'User created successfully', 201);
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}
