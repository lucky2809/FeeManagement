/**
 * GET /api/setup
 * Returns initial setup credentials on first run
 */
import { NextResponse } from 'next/server';
import { performInitialSetup, isSystemInitialized } from '@/lib/setup';

export async function GET() {
  try {
    const initialized = await isSystemInitialized();

    if (initialized) {
      return NextResponse.json({
        success: true,
        initialized: true,
        message: 'System already initialized',
      });
    }

    const setupResult = await performInitialSetup();

    if (!setupResult) {
      return NextResponse.json({
        success: false,
        message: 'Setup failed',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      initialized: false,
      message: 'Super Admin created successfully. Save these credentials!',
      credentials: {
        email: setupResult.email,
        password: setupResult.password,
      },
    });
  } catch (error) {
    console.error('Setup route error:', error);
    return NextResponse.json({
      success: false,
      message: 'Setup error: ' + error.message,
    }, { status: 500 });
  }
}
