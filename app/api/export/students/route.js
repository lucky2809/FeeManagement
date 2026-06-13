/**
 * /api/export/students
 * GET - Export students to Excel
 */
import connectDB from '@/lib/db';
import Student from '@/models/Student';
import { authenticateRequest } from '@/lib/auth';
import { unauthorizedResponse, errorResponse } from '@/lib/apiResponse';

export async function GET(request) {
  try {
    await authenticateRequest(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const degree = searchParams.get('degree');
    const course = searchParams.get('course');
    const status = searchParams.get('status');

    const query = {};
    if (degree) query.degree = degree;
    if (course) query.course = course;
    if (status) query.status = status;

    const students = await Student.find(query)
      .populate('degree', 'name')
      .populate('course', 'name code')
      .populate('department', 'name')
      .sort({ fullName: 1 });

    // Format data for export
    const exportData = students.map((s, idx) => ({
      'S.No': idx + 1,
      'Full Name': s.fullName,
      "Father's Name": s.fatherName,
      "Mother's Name": s.motherName,
      'Enrollment No': s.enrollmentNumber,
      'Registration No': s.registrationNumber || 'N/A',
      'Mobile': s.mobileNumber,
      'Email': s.email || 'N/A',
      'Date of Birth': s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-IN') : 'N/A',
      'Gender': s.gender,
      'Degree': s.degree?.name || 'N/A',
      'Course': s.course?.name || 'N/A',
      'Department': s.department?.name || 'N/A',
      'Admission Year': s.admissionYear,
      'Current Year': s.currentYear,
      'Status': s.status,
      'Address': s.address,
      'City': s.city,
      'State': s.state,
    }));

    return new Response(JSON.stringify({ success: true, data: exportData }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}
