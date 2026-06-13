'use client';
/**
 * Payments List Page - View and record payments
 */
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import { Plus, Search, Filter, Download, DollarSign, X, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

const PAYMENT_MODES = ['Cash', 'Online', 'Cheque', 'DD', 'Bank Transfer', 'UPI', 'Card'];
const EMPTY_FORM = {
  student: '', fee: '', amount: '', paymentMode: 'Cash',
  paymentDate: new Date().toISOString().split('T')[0],
  transactionId: '', chequeNumber: '', bankName: '', remarks: '',
};

export default function PaymentsPage() {
  const { isAdmin } = useAuth();

  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // For Add Payment flow
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feeRecords, setFeeRecords] = useState([]);
  const [selectedFee, setSelectedFee] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);

  const fetchPayments = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      const res = await fetch(`/api/payments?${params}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.data.payments);
        setPagination(data.data.pagination);
      }
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => { fetchPayments(1); }, [fetchPayments]);

  // Search students debounce
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

  // Load fee records when student selected
  useEffect(() => {
    if (!form.student) { setFeeRecords([]); setSelectedFee(null); return; }
    fetch(`/api/fees?student=${form.student}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          // Only unpaid/partial fees
          setFeeRecords(d.data.filter((f) => f.status !== 'Paid'));
        }
      });
  }, [form.student]);

  // Set max amount when fee changes
  useEffect(() => {
    if (!form.fee) { setSelectedFee(null); return; }
    const f = feeRecords.find((r) => r._id === form.fee);
    setSelectedFee(f || null);
  }, [form.fee, feeRecords]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setStudentSearch('');
    setStudents([]);
    setSelectedStudent(null);
    setFeeRecords([]);
    setSelectedFee(null);
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.student) errs.student = 'Select a student';
    if (!form.fee) errs.fee = 'Select a fee record';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) errs.amount = 'Enter a valid amount';
    if (!form.paymentMode) errs.paymentMode = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Payment recorded successfully');
        setModalOpen(false);
        fetchPayments(1);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const res = await fetch('/api/export/fees');
      const data = await res.json();
      if (data.success) {
        const ws = XLSX.utils.json_to_sheet(data.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Payments');
        XLSX.writeFile(wb, `payments_${new Date().toISOString().slice(0, 10)}.xlsx`);
        toast.success('Exported successfully');
      }
    } catch {
      toast.error('Export failed');
    }
  };

  const filtered = payments.filter((p) => {
    const name = p.student?.fullName?.toLowerCase() || '';
    const receipt = p.receiptNumber?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || receipt.includes(q);
  });

  const remaining = selectedFee
    ? Math.max(0, selectedFee.totalFee - (selectedFee.discount || 0) + (selectedFee.fineAmount || 0) - selectedFee.paidAmount)
    : 0;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pagination.total} total payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="w-4 h-4" /> Export
          </Button>
          {isAdmin && (
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4" /> Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name or receipt no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" /> Date Filter
          </Button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(''); setToDate(''); }}
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Mode</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Academic Year</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Collected By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <DollarSign className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No payments found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{p.receiptNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{p.student?.fullName}</p>
                        <p className="text-xs text-gray-400 font-mono">{p.student?.enrollmentNumber}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {format(new Date(p.paymentDate), 'dd MMM yyyy')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(p.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="info">{p.paymentMode}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{p.academicYear}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{p.collectedBy?.name || '—'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={(page) => fetchPayments(page)}
        />
      </div>

      {/* Add Payment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Payment"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Record Payment</Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Student search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Student <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search student by name or enrollment..."
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setForm({ ...form, student: '', fee: '' });
                  setSelectedStudent(null);
                  setFeeRecords([]);
                }}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.student && <p className="mt-1 text-xs text-red-500">{errors.student}</p>}
            {form.student && <p className="mt-1 text-xs text-green-600">✓ Student selected</p>}
            {students.length > 0 && !form.student && (
              <div className="mt-1 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden max-h-36 overflow-y-auto">
                {students.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, student: s._id, fee: '' });
                      setStudentSearch(`${s.fullName} (${s.enrollmentNumber})`);
                      setSelectedStudent(s);
                      setStudents([]);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">{s.fullName}</span>
                    <span className="ml-2 text-gray-400 text-xs font-mono">{s.enrollmentNumber}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fee record selection */}
          {form.student && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fee Record <span className="text-red-500">*</span>
              </label>
              {feeRecords.length === 0 ? (
                <p className="text-sm text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                  No pending fee records found for this student
                </p>
              ) : (
                <div className="space-y-2">
                  {feeRecords.map((f) => {
                    const rem = Math.max(0, f.totalFee - (f.discount || 0) + (f.fineAmount || 0) - f.paidAmount);
                    return (
                      <label
                        key={f._id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          form.fee === f._id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="fee"
                          value={f._id}
                          checked={form.fee === f._id}
                          onChange={() => setForm({ ...form, fee: f._id })}
                          className="text-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Year {f.yearNumber} — {f.academicYear}
                          </p>
                          <p className="text-xs text-gray-500">
                            Remaining: <span className="font-semibold text-red-600">{formatCurrency(rem)}</span>
                          </p>
                        </div>
                        <Badge variant={f.status === 'Partial' ? 'warning' : 'danger'}>{f.status}</Badge>
                      </label>
                    );
                  })}
                </div>
              )}
              {errors.fee && <p className="mt-1 text-xs text-red-500">{errors.fee}</p>}
            </div>
          )}

          {/* Payment details */}
          {form.fee && (
            <>
              {selectedFee && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Remaining balance: </span>
                  <span className="font-bold text-blue-700 dark:text-blue-300">{formatCurrency(remaining)}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Amount (₹)"
                  type="number"
                  min="1"
                  max={remaining || undefined}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  error={errors.amount}
                  required
                  placeholder="Enter amount"
                />
                <Select
                  label="Payment Mode"
                  value={form.paymentMode}
                  onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                  error={errors.paymentMode}
                  required
                  options={PAYMENT_MODES.map((m) => ({ value: m, label: m }))}
                />
              </div>
              <Input
                label="Payment Date"
                type="date"
                value={form.paymentDate}
                onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                required
              />
              {['Cheque', 'DD'].includes(form.paymentMode) && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Cheque/DD Number"
                    value={form.chequeNumber}
                    onChange={(e) => setForm({ ...form, chequeNumber: e.target.value })}
                    placeholder="Cheque number"
                  />
                  <Input
                    label="Bank Name"
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    placeholder="Bank name"
                  />
                </div>
              )}
              {['Online', 'UPI', 'Bank Transfer', 'Card'].includes(form.paymentMode) && (
                <Input
                  label="Transaction ID"
                  value={form.transactionId}
                  onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                  placeholder="Transaction reference"
                />
              )}
              <Input
                label="Remarks"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Optional remarks"
              />
            </>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
