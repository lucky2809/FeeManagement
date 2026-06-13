/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
import connectDB from '@/lib/db';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/apiResponse';

export async function GET(request) {
  try {
    const decoded = await authenticateRequest(request);
    await connectDB();

    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return unauthorizedResponse('User not found or inactive');
    }

    return successResponse(user);
  } catch (error) {
    if (error.message.includes('token') || error.message.includes('Token')) {
      return unauthorizedResponse(error.message);
    }
    return errorResponse(error.message, 500);
  }
}

/**
 * PATCH /api/auth/me
 * Update current user profile
 */
export async function PATCH(request) {
  try {
    const decoded = await authenticateRequest(request);
    await connectDB();

    const body = await request.json();
    const { name, email, currentPassword, newPassword, profileImage } = body;

    const user = await User.findById(decoded.userId).select('+password');

    if (!user) {
      return unauthorizedResponse('User not found');
    }

    // Update name
    if (name) user.name = name;

    // Update email (check uniqueness)
    if (email && email !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return errorResponse('Email already in use', 400);
      }
      user.email = email.toLowerCase();
    }

    // Update profile image
    if (profileImage !== undefined) user.profileImage = profileImage;

    // Update password
    if (newPassword) {
      if (!currentPassword) {
        return errorResponse('Current password is required to change password', 400);
      }

      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        return errorResponse('Current password is incorrect', 400);
      }

      // Validate new password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return errorResponse(
          'New password must be at least 8 characters with uppercase, lowercase, number, and special character',
          400
        );
      }

      user.password = newPassword;
    }

    await user.save();

    return successResponse(user.toSafeObject(), 'Profile updated successfully');
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
