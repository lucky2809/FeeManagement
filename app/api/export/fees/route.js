/**
 * /api/export/fees
 * GET - Export fee report data
 */
import connectDB from '@/lib/db';
import Fee from '@/models/Fee';
import { authenticateRequest } from '@/lib/auth';
import { unauthorizedResponse, errorResponse } from '@/lib/apiResponse';

export async function GET(request) {
  try {
    await authenticateRequest(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const status = searchParams.get('status');

    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;

    const fees = await Fee.find(query)
      .populate({
        path: 'student',
        select: 'fullName enrollmentNumber mobileNumber degree course department',
        populate: [
          { path: 'degree', select: 'name' },
          { path: 'course', select: 'name' },
          { path: 'department', select: 'name' },
        ],
      })
      .sort({ createdAt: -1 });

    const exportData = fees.map((f, idx) => {
      const effective = f.totalFee - f.discount + f.fineAmount;
      const remaining = Math.max(0, effective - f.paidAmount);
      return {
        'S.No': idx + 1,
        'Student Name': f.student?.fullName || 'N/A',
        'Enrollment No': f.student?.enrollmentNumber || 'N/A',
        'Mobile': f.student?.mobileNumber || 'N/A',
        'Degree': f.student?.degree?.name || 'N/A',
        'Course': f.student?.course?.name || 'N/A',
        'Department': f.student?.department?.name || 'N/A',
        'Academic Year': f.academicYear,
        'Year No': f.yearNumber,
        'Total Fee': f.totalFee,
        'Discount': f.discount,
        'Fine': f.fineAmount,
        'Paid Amount': f.paidAmount,
        'Remaining Amount': remaining,
        'Status': f.status,
        'Due Date': f.dueDate ? new Date(f.dueDate).toLocaleDateString('en-IN') : 'N/A',
      };
    });

    return new Response(JSON.stringify({ success: true, data: exportData }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}
