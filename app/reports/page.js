'use client';
/**
 * Reports Page - Fee & Student export reports with summary stats
 */
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import {
  BarChart3,
  Download,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  Filter,
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
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'];

const ACADEMIC_YEARS = Array.from({ length: 6 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { value: `${y}-${y + 1}`, label: `${y}-${y + 1}` };
});

const FEE_STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Partial', label: 'Partial' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Overdue', label: 'Overdue' },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function downloadCSV(data, filename) {
  if (!data || data.length === 0) {
    toast.error('No data to export');
    return;
  }
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h] ?? '';
      // Wrap in quotes if contains comma or newline
      return String(val).includes(',') || String(val).includes('\n')
        ? `"${String(val).replace(/"/g, '""')}"`
        : String(val);
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`${filename} downloaded`);
}

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const [feeData, setFeeData] = useState([]);
  const [studentData, setStudentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingFees, setExportingFees] = useState(false);
  const [exportingStudents, setExportingStudents] = useState(false);

  // Filters
  const [academicYear, setAcademicYear] = useState('');
  const [feeStatus, setFeeStatus] = useState('');

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const feeParams = new URLSearchParams();
      if (academicYear) feeParams.set('academicYear', academicYear);
      if (feeStatus) feeParams.set('status', feeStatus);

      const [feeRes, studentRes] = await Promise.all([
        fetch(`/api/export/fees?${feeParams}`),
        fetch('/api/export/students'),
      ]);
      const [feeJson, studentJson] = await Promise.all([feeRes.json(), studentRes.json()]);

      if (feeJson.success) setFeeData(feeJson.data);
      if (studentJson.success) setStudentData(studentJson.data);
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [academicYear, feeStatus]);

  useEffect(() => { fetchReportData(); }, [fetchReportData]);

  // Derived stats from fee data
  const totalFeeExpected = feeData.reduce((s, r) => s + (Number(r['Total Fee']) || 0), 0);
  const totalPaid = feeData.reduce((s, r) => s + (Number(r['Paid Amount']) || 0), 0);
  const totalRemaining = feeData.reduce((s, r) => s + (Number(r['Remaining Amount']) || 0), 0);
  const totalDiscount = feeData.reduce((s, r) => s + (Number(r['Discount']) || 0), 0);

  // Fee status distribution for pie chart
  const statusCounts = feeData.reduce((acc, r) => {
    const s = r['Status'] || 'Unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Fee by academic year for bar chart
  const byYear = feeData.reduce((acc, r) => {
    const yr = r['Academic Year'] || 'Unknown';
    if (!acc[yr]) acc[yr] = { year: yr, collected: 0, pending: 0 };
    acc[yr].collected += Number(r['Paid Amount']) || 0;
    acc[yr].pending += Number(r['Remaining Amount']) || 0;
    return acc;
  }, {});
  const barData = Object.values(byYear).sort((a, b) => a.year.localeCompare(b.year));

  const handleExportFees = async () => {
    setExportingFees(true);
    try {
      const params = new URLSearchParams();
      if (academicYear) params.set('academicYear', academicYear);
      if (feeStatus) params.set('status', feeStatus);
      const res = await fetch(`/api/export/fees?${params}`);
      const json = await res.json();
      if (json.success) {
        const label = academicYear ? academicYear.replace('-', '_') : 'all';
        downloadCSV(json.data, `fee_report_${label}.csv`);
      } else {
        toast.error(json.message || 'Export failed');
      }
    } catch {
      toast.error('Export failed');
    } finally {
      setExportingFees(false);
    }
  };

  const handleExportStudents = async () => {
    setExportingStudents(true);
    try {
      const res = await fetch('/api/export/students');
      const json = await res.json();
      if (json.success) {
        downloadCSV(json.data, 'students_report.csv');
      } else {
        toast.error(json.message || 'Export failed');
      }
    } catch {
      toast.error('Export failed');
    } finally {
      setExportingStudents(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Fee collection and student data reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportStudents} loading={exportingStudents}>
            <FileSpreadsheet className="w-4 h-4" />
            Export Students
          </Button>
          <Button onClick={handleExportFees} loading={exportingFees}>
            <Download className="w-4 h-4" />
            Export Fees
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter Fee Report</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-56">
            <Select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              options={[{ value: '', label: 'All Academic Years' }, ...ACADEMIC_YEARS]}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              value={feeStatus}
              onChange={(e) => setFeeStatus(e.target.value)}
              options={FEE_STATUS_OPTIONS}
            />
          </div>
          {(academicYear || feeStatus) && (
            <button
              onClick={() => { setAcademicYear(''); setFeeStatus(''); }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 animate-pulse border border-gray-200 dark:border-gray-700">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Fee Expected"
            value={formatCurrency(totalFeeExpected)}
            subtitle={`${feeData.length} fee records`}
            icon={DollarSign}
            color="blue"
          />
          <StatCard
            title="Total Collected"
            value={formatCurrency(totalPaid)}
            subtitle={`${((totalPaid / (totalFeeExpected || 1)) * 100).toFixed(1)}% of expected`}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Total Remaining"
            value={formatCurrency(totalRemaining)}
            subtitle="Outstanding balance"
            icon={AlertCircle}
            color="red"
          />
          <StatCard
            title="Total Discount"
            value={formatCurrency(totalDiscount)}
            subtitle={`${studentData.length} students total`}
            icon={Users}
            color="yellow"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Bar chart - fee collection by academic year */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Fee Collection by Academic Year
            </h2>
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </div>
          {loading || barData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
              {loading ? 'Loading...' : 'No data for selected filters'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend iconSize={8} />
                <Bar dataKey="collected" fill="#22c55e" radius={[4, 4, 0, 0]} name="Collected" />
                <Bar dataKey="pending" fill="#ef4444" radius={[4, 4, 0, 0]} name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart - fee status distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Fee Status</h2>
            <Clock className="w-4 h-4 text-yellow-500" />
          </div>
          {loading || pieData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
              {loading ? 'Loading...' : 'No data'}
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={8} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fee Records Table Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Fee Records Preview</h2>
            <p className="text-xs text-gray-400 mt-0.5">Showing latest 20 records — use Export to download all</p>
          </div>
          <Button size="sm" onClick={handleExportFees} loading={exportingFees}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {['Student', 'Enrollment', 'Academic Year', 'Year', 'Total Fee', 'Paid', 'Remaining', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : feeData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No fee records found for the selected filters
                  </td>
                </tr>
              ) : (
                feeData.slice(0, 20).map((row, i) => {
                  const statusColors = { Paid: 'success', Partial: 'warning', Pending: 'default', Overdue: 'danger' };
                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {row['Student Name']}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400">
                        {row['Enrollment No']}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {row['Academic Year']}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        Year {row['Year No']}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(row['Total Fee'])}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(row['Paid Amount'])}
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium ${Number(row['Remaining Amount']) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {formatCurrency(row['Remaining Amount'])}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusColors[row['Status']] || 'default'}>
                          {row['Status']}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
