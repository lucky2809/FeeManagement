'use client';
/**
 * Fee Records Page - Manage year-wise fee records per student
 */
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import { Plus, Search, Eye, Pencil, Trash2, CreditCard, Filter, X, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

const ACADEMIC_YEARS = Array.from({ length: 6 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { value: `${y}-${y + 1}`, label: `${y}-${y + 1}` };
});

const EMPTY_FORM = {
  student: '', academicYear: ACADEMIC_YEARS[0].value, yearNumber: '1',
  totalFee: '', discount: '0', fineAmount: '0', dueDate: '', remarks: '',
};

export default function FeesPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();

  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentLoading, setStudentLoading] = useState(false);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (academicYearFilter) params.set('academicYear', academicYearFilter);
      const res = await fetch(`/api/fees?${params}`);
      const data = await res.json();
      if (data.success) setFees(data.data);
    } catch {
      toast.error('Failed to load fee records');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, academicYearFilter]);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  // Student search with debounce
  useEffect(() => {
    if (!studentSearch || studentSearch.length < 2) { setStudents([]); return; }
    setStudentLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/students?search=${encodeURIComponent(studentSearch)}&limit=20`);
        const data = await res.json();
        if (data.success) setStudents(data.data.students || []);
      } catch { /* ignore */ }
      finally { setStudentLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [studentSearch]);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setStudentSearch('');
    setStudents([]);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      student: item.student?._id || item.student,
      academicYear: item.academicYear,
      yearNumber: item.yearNumber?.toString(),
      totalFee: item.totalFee?.toString(),
      discount: item.discount?.toString() || '0',
      fineAmount: item.fineAmount?.toString() || '0',
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
      remarks: item.remarks || '',
    });
    setStudentSearch(item.student?.fullName || '');
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.student) errs.student = 'Select a student';
    if (!form.academicYear) errs.academicYear = 'Required';
    if (!form.yearNumber) errs.yearNumber = 'Required';
    if (!form.totalFee || isNaN(form.totalFee)) errs.totalFee = 'Enter a valid fee amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = editItem ? `/api/fees/${editItem._id}` : '/api/fees';
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          totalFee: Number(form.totalFee),
          discount: Number(form.discount) || 0,
          fineAmount: Number(form.fineAmount) || 0,
          yearNumber: Number(form.yearNumber),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editItem ? 'Fee record updated' : 'Fee record created');
        setModalOpen(false);
        fetchFees();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/fees/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Fee record deleted');
        setDeleteId(null);
        fetchFees();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = fees.filter((f) => {
    const name = f.student?.fullName?.toLowerCase() || '';
    const enroll = f.student?.enrollmentNumber?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || enroll.includes(q);
  });

  const getStatusColor = (status) => {
    if (status === 'Paid') return 'success';
    if (status === 'Partial') return 'warning';
    if (status === 'Overdue') return 'danger';
    return 'default';
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Records</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{filtered.length} records</p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Fee Record
          </Button>
        )}
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
              onChange={(e) => setSearch(e.target.value)}
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              {['Unpaid', 'Partial', 'Paid', 'Overdue'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={academicYearFilter}
              onChange={(e) => setAcademicYearFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Academic Years</option>
              {ACADEMIC_YEARS.map((y) => (
                <option key={y.value} value={y.value}>{y.label}</option>
              ))}
            </select>
            {(statusFilter || academicYearFilter) && (
              <button
                onClick={() => { setStatusFilter(''); setAcademicYearFilter(''); }}
                className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Academic Year</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Year</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Fee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Remaining</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No fee records found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((fee) => {
                  const effective = fee.totalFee - (fee.discount || 0) + (fee.fineAmount || 0);
                  const remaining = Math.max(0, effective - fee.paidAmount);
                  return (
                    <tr key={fee._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {fee.student?.fullName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {fee.student?.enrollmentNumber}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{fee.academicYear}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Year {fee.yearNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(fee.totalFee)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-green-600">{formatCurrency(fee.paidAmount)}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`text-sm font-medium ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(remaining)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusColor(fee.status)}>{fee.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => router.push(`/students/${fee.student?._id}`)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="View student"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => openEdit(fee)}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteId(fee._id)}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Fee Record' : 'Add Fee Record'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editItem ? 'Update Record' : 'Create Record'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Student search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Student <span className="text-red-500">*</span>
            </label>
            {editItem ? (
              <div className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                {studentSearch || 'Loading...'}
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search student by name or enrollment..."
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setForm({ ...form, student: '' });
                    }}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {form.student && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ Student selected</p>
                )}
                {errors.student && (
                  <p className="mt-1 text-xs text-red-500">{errors.student}</p>
                )}
                {students.length > 0 && !form.student && (
                  <div className="mt-1 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                    {studentLoading ? (
                      <div className="px-3 py-2 text-sm text-gray-400">Searching...</div>
                    ) : (
                      students.map((s) => (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, student: s._id });
                            setStudentSearch(`${s.fullName} (${s.enrollmentNumber})`);
                            setStudents([]);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <span className="font-medium text-gray-900 dark:text-white">{s.fullName}</span>
                          <span className="ml-2 text-gray-400 text-xs font-mono">{s.enrollmentNumber}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Academic Year"
              value={form.academicYear}
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
              error={errors.academicYear}
              required
              options={ACADEMIC_YEARS}
            />
            <Select
              label="Year Number"
              value={form.yearNumber}
              onChange={(e) => setForm({ ...form, yearNumber: e.target.value })}
              error={errors.yearNumber}
              required
              options={Array.from({ length: 6 }, (_, i) => ({
                value: (i + 1).toString(), label: `Year ${i + 1}`,
              }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Total Fee (₹)"
              type="number"
              min="0"
              value={form.totalFee}
              onChange={(e) => setForm({ ...form, totalFee: e.target.value })}
              error={errors.totalFee}
              required
              placeholder="e.g. 50000"
            />
            <Input
              label="Discount (₹)"
              type="number"
              min="0"
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Fine Amount (₹)"
              type="number"
              min="0"
              value={form.fineAmount}
              onChange={(e) => setForm({ ...form, fineAmount: e.target.value })}
              placeholder="0"
            />
          </div>

          <Input
            label="Due Date"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />

          <Input
            label="Remarks"
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            placeholder="Optional remarks"
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Fee Record"
        message="This will delete the fee record and all associated payments. This cannot be undone."
        confirmText="Delete Record"
      />
    </DashboardLayout>
  );
}
