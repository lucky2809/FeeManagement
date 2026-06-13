/**
 * JWT Authentication utilities
 */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for a user
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header or cookie
 */
export function extractToken(request) {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookie
  const cookies = request.headers.get('cookie');
  if (cookies) {
    const tokenCookie = cookies.split(';').find((c) => c.trim().startsWith('auth_token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1].trim();
    }
  }

  return null;
}

/**
 * Middleware to authenticate API requests
 * Returns decoded user or throws error
 */
export async function authenticateRequest(request) {
  const token = extractToken(request);

  if (!token) {
    throw new Error('No authentication token provided');
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    throw new Error('Invalid or expired token');
  }

  return decoded;
}

/**
 * Check if user has required role
 */
export function hasRole(userRole, requiredRoles) {
  return requiredRoles.includes(userRole);
}

/**
 * Role hierarchy for permission checks
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  STAFF: 'staff',
};

export const ROLE_PERMISSIONS = {
  super_admin: ['all'],
  admin: ['manage_students', 'manage_fees', 'view_reports', 'manage_courses'],
  staff: ['view_students', 'view_fees', 'update_allowed'],
};
