/**
 * /api/dashboard
 * GET - Dashboard statistics and charts data
 */
import connectDB from '@/lib/db';
import Student from '@/models/Student';
import Course from '@/models/Course';
import Fee from '@/models/Fee';
import Payment from '@/models/Payment';
import { authenticateRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/apiResponse';

export async function GET(request) {
  try {
    await authenticateRequest(request);
    await connectDB();

    const currentYear = new Date().getFullYear();

    // Run all queries in parallel for performance
    const [
      totalStudents,
      activeStudents,
      totalCourses,
      totalFees,
      paidFees,
      recentStudents,
      recentPayments,
      admissionsByYear,
      feeCollectionByMonth,
      pendingFeeStudents,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'Active' }),
      Course.countDocuments({ isActive: true }),

      // Total fee expected
      Fee.aggregate([
        { $group: { _id: null, total: { $sum: '$totalFee' } } },
      ]),

      // Total fee collected
      Payment.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Recent 5 students
      Student.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('degree', 'name shortName')
        .populate('course', 'name')
        .select('fullName enrollmentNumber status admissionYear createdAt profileImage'),

      // Recent 5 payments
      Payment.find()
        .sort({ paymentDate: -1 })
        .limit(5)
        .populate('student', 'fullName enrollmentNumber')
        .select('amount paymentMode receiptNumber paymentDate'),

      // Admissions per year (last 5 years)
      Student.aggregate([
        { $match: { admissionYear: { $gte: currentYear - 4 } } },
        { $group: { _id: '$admissionYear', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Fee collection by month (current year)
      Payment.aggregate([
        {
          $match: {
            paymentDate: {
              $gte: new Date(`${currentYear}-01-01`),
              $lte: new Date(`${currentYear}-12-31`),
            },
          },
        },
        {
          $group: {
            _id: { $month: '$paymentDate' },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Count of students with pending fees
      Fee.countDocuments({ status: { $in: ['Pending', 'Partial', 'Overdue'] } }),
    ]);

    // Calculate totals
    const totalRevenue = paidFees[0]?.total || 0;
    const totalExpected = totalFees[0]?.total || 0;
    const totalPending = totalExpected - totalRevenue;

    // Format admission chart data
    const admissionChartData = admissionsByYear.map((item) => ({
      year: item._id.toString(),
      students: item.count,
    }));

    // Format fee collection chart (all 12 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const feeChartData = months.map((month, idx) => {
      const found = feeCollectionByMonth.find((f) => f._id === idx + 1);
      return {
        month,
        collected: found?.total || 0,
        count: found?.count || 0,
      };
    });

    // Fee status distribution
    const feeStatusData = await Fee.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$totalFee' } } },
    ]);

    return successResponse({
      stats: {
        totalStudents,
        activeStudents,
        totalCourses,
        totalRevenue,
        totalExpected,
        totalPending: Math.max(0, totalPending),
        pendingFeeStudents,
      },
      recentStudents,
      recentPayments,
      charts: {
        admissions: admissionChartData,
        feeCollection: feeChartData,
        feeStatus: feeStatusData.map((s) => ({ name: s._id, value: s.count, amount: s.amount })),
      },
    });
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}
