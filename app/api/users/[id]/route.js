/**
 * /api/users/[id]
 * GET - Get user by ID
 * PATCH - Update user
 * DELETE - Delete user (super_admin only; cannot delete super_admin)
 */
import connectDB from '@/lib/db';
import User from '@/models/User';
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
    const decoded = await authenticateRequest(request);
    if (!['super_admin', 'admin'].includes(decoded.role)) {
      return forbiddenResponse();
    }

    await connectDB();
    const { id } = await params;
    const user = await User.findById(id).select('-password').populate('createdBy', 'name email');

    if (!user) return notFoundResponse('User not found');

    return successResponse(user);
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const decoded = await authenticateRequest(request);
    if (!['super_admin', 'admin'].includes(decoded.role)) {
      return forbiddenResponse();
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { name, email, role, isActive, password } = body;

    const user = await User.findById(id).select('+password');
    if (!user) return notFoundResponse('User not found');

    // Admin cannot modify super_admin
    if (decoded.role === 'admin' && user.role === 'super_admin') {
      return forbiddenResponse('Admin cannot modify Super Admin');
    }

    // Admin cannot promote to super_admin
    if (decoded.role === 'admin' && role === 'super_admin') {
      return forbiddenResponse('Admin cannot assign Super Admin role');
    }

    if (name) user.name = name;
    if (email && email !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (existing) return errorResponse('Email already in use', 400);
      user.email = email.toLowerCase();
    }
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    if (password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!passwordRegex.test(password)) {
        return errorResponse('Password does not meet strength requirements', 400);
      }
      user.password = password;
    }

    await user.save();

    return successResponse(user.toSafeObject(), 'User updated successfully');
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const decoded = await authenticateRequest(request);

    // Only super_admin can delete users
    if (decoded.role !== 'super_admin') {
      return forbiddenResponse('Only Super Admin can delete users');
    }

    await connectDB();
    const { id } = await params;
    const user = await User.findById(id);
    if (!user) return notFoundResponse('User not found');

    // Cannot delete self
    if (user._id.toString() === decoded.userId) {
      return forbiddenResponse('Cannot delete your own account');
    }

    // Cannot delete super_admin accounts
    if (user.role === 'super_admin') {
      return forbiddenResponse('Cannot delete Super Admin accounts');
    }

    await User.findByIdAndDelete(id);

    return successResponse(null, 'User deleted successfully');
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}
