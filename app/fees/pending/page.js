'use client';
/**
 * Pending Fees Page - Students with outstanding fee balances
 */
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import { Search, Filter, Download, AlertCircle, Eye, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

const ACADEMIC_YEARS = Array.from({ length: 6 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { value: `${y}-${y + 1}`, label: `${y}-${y + 1}` };
});

export default function PendingFeesPage() {
  const router = useRouter();

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Fetch unpaid and partial fees
      if (statusFilter) {
        params.set('status', statusFilter);
      }
      if (academicYearFilter) params.set('academicYear', academicYearFilter);

      // When no status filter, fetch both Unpaid and Partial
      let all = [];
      if (!statusFilter) {
        const [res1, res2, res3] = await Promise.all([
          fetch('/api/fees?status=Unpaid'),
          fetch('/api/fees?status=Partial'),
          fetch('/api/fees?status=Overdue'),
        ]);
        const [d1, d2, d3] = await Promise.all([res1.json(), res2.json(), res3.json()]);
        if (d1.success) all = [...all, ...d1.data];
        if (d2.success) all = [...all, ...d2.data];
        if (d3.success) all = [...all, ...d3.data];
      } else {
        const res = await fetch(`/api/fees?${params}`);
        const data = await res.json();
        if (data.success) all = data.data;
      }

      // Apply academic year filter client-side if needed
      if (academicYearFilter) {
        all = all.filter((f) => f.academicYear === academicYearFilter);
      }

      setFees(all);
    } catch {
      toast.error('Failed to load pending fees');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, academicYearFilter]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const filtered = fees.filter((f) => {
    const name = f.student?.fullName?.toLowerCase() || '';
    const enroll = f.student?.enrollmentNumber?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || enroll.includes(q);
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalPending = filtered.reduce((sum, f) => {
    const rem = Math.max(0, f.totalFee - (f.discount || 0) + (f.fineAmount || 0) - f.paidAmount);
    return sum + rem;
  }, 0);

  const exportToExcel = () => {
    try {
      const rows = filtered.map((f) => ({
        'Student Name': f.student?.fullName,
        'Enrollment No': f.student?.enrollmentNumber,
        'Academic Year': f.academicYear,
        'Year': f.yearNumber,
        'Total Fee': f.totalFee,
        'Paid Amount': f.paidAmount,
        'Discount': f.discount || 0,
        'Fine': f.fineAmount || 0,
        'Remaining': Math.max(0, f.totalFee - (f.discount || 0) + (f.fineAmount || 0) - f.paidAmount),
        'Status': f.status,
        'Due Date': f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pending Fees');
      XLSX.writeFile(wb, `pending_fees_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  const getStatusVariant = (status) => {
    if (status === 'Overdue') return 'danger';
    if (status === 'Partial') return 'warning';
    return 'default';
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Fees</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filtered.length} students with outstanding balances
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportToExcel}>
          <Download className="w-4 h-4" /> Export
        </Button>
      </div>

      {/* Summary Card */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-red-800 dark:text-red-200">Total Outstanding Balance</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name or enrollment..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" /> Filters
          </Button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Pending</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
              <option value="Overdue">Overdue</option>
            </select>
            <select
              value={academicYearFilter}
              onChange={(e) => { setAcademicYearFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Academic Years</option>
              {ACADEMIC_YEARS.map((y) => (
                <option key={y.value} value={y.value}>{y.label}</option>
              ))}
            </select>
            {(statusFilter || academicYearFilter) && (
              <button
                onClick={() => { setStatusFilter(''); setAcademicYearFilter(''); setPage(1); }}
                className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-gray-700"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Academic Year</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Year</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Fee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remaining</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Due Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No pending fees found</p>
                    <p className="text-sm text-gray-400 mt-1">All students are up to date!</p>
                  </td>
                </tr>
              ) : (
                paginated.map((fee) => {
                  const effective = fee.totalFee - (fee.discount || 0) + (fee.fineAmount || 0);
                  const remaining = Math.max(0, effective - fee.paidAmount);
                  const isOverdue = fee.dueDate && new Date(fee.dueDate) < new Date() && fee.status !== 'Paid';
                  return (
                    <tr key={fee._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isOverdue ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{fee.student?.fullName}</p>
                          <p className="text-xs text-gray-400 font-mono">{fee.student?.enrollmentNumber}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{fee.academicYear}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Year {fee.yearNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(fee.totalFee)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-green-600 font-medium">{formatCurrency(fee.paidAmount)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-red-600">{formatCurrency(remaining)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusVariant(fee.status)}>{fee.status}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {fee.dueDate ? (
                          <span className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                            {new Date(fee.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {isOverdue && ' ⚠'}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => router.push(`/students/${fee.student?._id}`)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors"
                            title="View student"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </DashboardLayout>
  );
}
