/**
 * Standardized API response helpers
 */
import { NextResponse } from 'next/server';

export function successResponse(data, message = 'Success', status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

export function errorResponse(message = 'An error occurred', status = 500, errors = null) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { status }
  );
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = 'Forbidden - Insufficient permissions') {
  return errorResponse(message, 403);
}

export function notFoundResponse(message = 'Resource not found') {
  return errorResponse(message, 404);
}

export function validationErrorResponse(errors) {
  return errorResponse('Validation failed', 422, errors);
}
