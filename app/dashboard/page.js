'use client';
/**
 * Dashboard Page
 */
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import {
  GraduationCap,
  BookOpen,
  DollarSign,
  AlertCircle,
  Users,
  TrendingUp,
  Calendar,
  CreditCard,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import Badge from '@/components/ui/Badge';
import { format } from 'date-fns';

const PIE_COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'];

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard');
        const result = await res.json();
        if (result.success) setData(result.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  const { stats = {}, recentStudents = [], recentPayments = [], charts = {} } = data || {};

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents?.toLocaleString() || '0'}
          icon={GraduationCap}
          color="blue"
          subtitle={`${stats.activeStudents || 0} active`}
        />
        <StatCard
          title="Total Courses"
          value={stats.totalCourses?.toLocaleString() || '0'}
          icon={BookOpen}
          color="purple"
          subtitle="Active courses"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue || 0)}
          icon={DollarSign}
          color="green"
          subtitle="Collected fees"
        />
        <StatCard
          title="Pending Fees"
          value={formatCurrency(stats.totalPending || 0)}
          icon={AlertCircle}
          color="red"
          subtitle={`${stats.pendingFeeStudents || 0} students pending`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Admission Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Admissions by Year</h2>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.admissions || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#f9fafb',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fee Status Pie */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Fee Status</h2>
            <CreditCard className="w-4 h-4 text-green-500" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={charts.feeStatus || []}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {(charts.feeStatus || []).map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val, name) => [val, name]} />
              <Legend iconSize={8} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fee Collection Line Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Monthly Fee Collection ({new Date().getFullYear()})</h2>
          <DollarSign className="w-4 h-4 text-green-500" />
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={charts.feeCollection || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Line type="monotone" dataKey="collected" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Collected" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Admissions</h2>
            <a href="/students" className="text-xs text-blue-600 hover:underline">View all</a>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentStudents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No students yet</p>
            ) : (
              recentStudents.map((s) => (
                <div key={s._id} className="flex items-center gap-3 px-6 py-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {s.fullName?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.enrollmentNumber} • {s.degree?.shortName}</p>
                  </div>
                  <Badge>{s.status}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Payments</h2>
            <a href="/fees/payments" className="text-xs text-blue-600 hover:underline">View all</a>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentPayments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No payments yet</p>
            ) : (
              recentPayments.map((p) => (
                <div key={p._id} className="flex items-center gap-3 px-6 py-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {p.student?.fullName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {p.receiptNumber} • {p.paymentMode}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(p.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
