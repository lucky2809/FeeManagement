/**
 * /api/payments
 * GET - List payments
 * POST - Record a new payment
 */
import connectDB from '@/lib/db';
import Payment from '@/models/Payment';
import Fee from '@/models/Fee';
import { authenticateRequest } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/apiResponse';

/**
 * Generate a unique receipt number
 */
async function generateReceiptNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const count = await Payment.countDocuments();
  const seq = String(count + 1).padStart(5, '0');
  return `RCPT-${year}${month}-${seq}`;
}

export async function GET(request) {
  try {
    const decoded = await authenticateRequest(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const student = searchParams.get('student');
    const fee = searchParams.get('fee');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const query = {};
    if (student) query.student = student;
    if (fee) query.fee = fee;
    if (fromDate || toDate) {
      query.paymentDate = {};
      if (fromDate) query.paymentDate.$gte = new Date(fromDate);
      if (toDate) query.paymentDate.$lte = new Date(toDate);
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('student', 'fullName enrollmentNumber')
      .populate('fee', 'academicYear yearNumber totalFee')
      .populate('collectedBy', 'name email')
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return successResponse({
      payments,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    return errorResponse(error.message, 500);
  }
}

export async function POST(request) {
  try {
    const decoded = await authenticateRequest(request);
    if (!['super_admin', 'admin'].includes(decoded.role)) return forbiddenResponse();

    await connectDB();
    const body = await request.json();
    const { student, fee: feeId, amount, paymentMode, paymentDate, remarks, transactionId, chequeNumber, bankName } = body;

    if (!student || !feeId || !amount || !paymentMode) {
      return errorResponse('Student, fee, amount, and payment mode are required', 400);
    }

    // Get the fee record
    const feeRecord = await Fee.findById(feeId);
    if (!feeRecord) return errorResponse('Fee record not found', 404);

    // Check if payment exceeds remaining amount
    const effective = feeRecord.totalFee - feeRecord.discount + feeRecord.fineAmount;
    const remaining = effective - feeRecord.paidAmount;

    if (parseFloat(amount) > remaining) {
      return errorResponse(`Payment amount (${amount}) exceeds remaining balance (${remaining})`, 400);
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber();

    // Create payment
    const payment = await Payment.create({
      student,
      fee: feeId,
      receiptNumber,
      amount: parseFloat(amount),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMode,
      transactionId,
      chequeNumber,
      bankName,
      remarks,
      academicYear: feeRecord.academicYear,
      collectedBy: decoded.userId,
    });

    // Update fee's paid amount
    feeRecord.paidAmount += parseFloat(amount);
    feeRecord.updatedBy = decoded.userId;
    await feeRecord.save();

    const populated = await Payment.findById(payment._id)
      .populate('student', 'fullName enrollmentNumber')
      .populate('fee', 'academicYear yearNumber totalFee paidAmount')
      .populate('collectedBy', 'name email');

    return successResponse(
      { payment: populated, updatedFee: feeRecord },
      'Payment recorded successfully',
      201
    );
  } catch (error) {
    if (error.message.includes('token')) return unauthorizedResponse(error.message);
    if (error.code === 11000) return errorResponse('Duplicate receipt number', 400);
    return errorResponse(error.message, 500);
  }
}
