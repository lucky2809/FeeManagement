'use client';
/**
 * Student Profile/Detail Page
 */
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Pencil,
  Printer,
  Download,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  BookOpen,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{value || 'N/A'}</p>
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAdmin } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else toast.error('Failed to load student');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Student not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const { student, fees, payments, feeSummary } = data;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Student Profile</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4" /> Print
            </Button>
            {isAdmin && (
              <Button size="sm" onClick={() => router.push(`/students/${id}/edit`)}>
                <Pencil className="w-4 h-4" /> Edit
              </Button>
            )}
          </div>
        </div>

        {/* Student Header Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-2xl font-bold">
              {student.fullName?.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{student.fullName}</h2>
              <p className="text-blue-100 mt-1">{student.enrollmentNumber}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="inline-flex items-center gap-1 text-sm text-blue-100">
                  <BookOpen className="w-4 h-4" />
                  {student.course?.name} • {student.degree?.shortName}
                </span>
                <span className="inline-flex items-center gap-1 text-sm text-blue-100">
                  <Calendar className="w-4 h-4" />
                  Batch {student.admissionYear} • Year {student.currentYear}
                </span>
              </div>
            </div>
            <Badge>{student.status}</Badge>
          </div>
        </div>

        {/* Fee Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Fee', value: formatCurrency(feeSummary?.totalFee), color: 'blue', icon: CreditCard },
            { label: 'Paid Amount', value: formatCurrency(feeSummary?.totalPaid), color: 'green', icon: CheckCircle },
            { label: 'Remaining', value: formatCurrency(feeSummary?.totalRemaining), color: 'red', icon: AlertCircle },
            { label: 'Payments', value: feeSummary?.paymentCount || 0, color: 'purple', icon: Clock },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700`}>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className={`text-xl font-bold mt-1 ${color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : color === 'purple' ? 'text-purple-600' : 'text-blue-600'}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Personal Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Personal Info</h3>
            <div className="space-y-1 divide-y divide-gray-100 dark:divide-gray-700">
              <InfoRow label="Father's Name" value={student.fatherName} icon={User} />
              <InfoRow label="Mother's Name" value={student.motherName} icon={User} />
              <InfoRow label="Mobile" value={student.mobileNumber} icon={Phone} />
              <InfoRow label="Email" value={student.email} icon={Mail} />
              <InfoRow label="Date of Birth" value={student.dateOfBirth ? format(new Date(student.dateOfBirth), 'dd MMM yyyy') : 'N/A'} icon={Calendar} />
              <InfoRow label="Gender" value={student.gender} />
              <InfoRow label="Address" value={`${student.address}, ${student.city}, ${student.state}`} icon={MapPin} />
            </div>
          </div>

          {/* Academic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Academic Info</h3>
            <div className="space-y-1 divide-y divide-gray-100 dark:divide-gray-700">
              <InfoRow label="Enrollment No" value={student.enrollmentNumber} />
              <InfoRow label="Registration No" value={student.registrationNumber} />
              <InfoRow label="Degree" value={student.degree?.name} icon={BookOpen} />
              <InfoRow label="Course" value={`${student.course?.name} (${student.course?.code})`} />
              <InfoRow label="Department" value={student.department?.name} />
              <InfoRow label="Admission Year" value={student.admissionYear} />
              <InfoRow label="Current Year" value={`Year ${student.currentYear}, Sem ${student.currentSemester}`} />
            </div>
          </div>

          {/* Fee Year-wise */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Fee Year-wise</h3>
            {fees.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No fee records</p>
            ) : (
              <div className="space-y-3">
                {fees.map((fee) => {
                  const remaining = Math.max(0, fee.totalFee - fee.discount + fee.fineAmount - fee.paidAmount);
                  return (
                    <div key={fee._id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Year {fee.yearNumber} ({fee.academicYear})
                        </span>
                        <Badge>{fee.status}</Badge>
                      </div>
                      <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Total Fee</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(fee.totalFee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Paid</span>
                          <span className="font-medium text-green-600">{formatCurrency(fee.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Remaining</span>
                          <span className={`font-medium ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(remaining)}
                          </span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${Math.min(100, (fee.paidAmount / fee.totalFee) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Payment History</h3>
          </div>
          {payments.length === 0 ? (
            <div className="py-8 text-center">
              <CreditCard className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No payments recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Receipt No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Mode</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Collected By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300">{p.receiptNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {format(new Date(p.paymentDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="info">{p.paymentMode}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                        {p.collectedBy?.name || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
