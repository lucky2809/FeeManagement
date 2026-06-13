'use client';
/**
 * Courses Management Page
 */
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Plus, Pencil, Trash2, BookOpen, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', code: '', degree: '', department: '', duration: '', durationUnit: 'Years', totalFee: '', description: '', isActive: true };

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredDepts, setFilteredDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, dRes, dpRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/degrees'),
        fetch('/api/departments'),
      ]);
      const [cData, dData, dpData] = await Promise.all([cRes.json(), dRes.json(), dpRes.json()]);
      if (cData.success) setCourses(cData.data);
      if (dData.success) setDegrees(dData.data);
      if (dpData.success) setDepartments(dpData.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Filter departments by selected degree
  useEffect(() => {
    if (form.degree) {
      setFilteredDepts(departments.filter((d) => d.degree?._id === form.degree || d.degree === form.degree));
    } else {
      setFilteredDepts([]);
    }
  }, [form.degree, departments]);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      code: item.code,
      degree: item.degree?._id || item.degree,
      department: item.department?._id || item.department,
      duration: item.duration?.toString() || '',
      durationUnit: item.durationUnit || 'Years',
      totalFee: item.totalFee?.toString() || '',
      description: item.description || '',
      isActive: item.isActive !== false,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.code.trim()) errs.code = 'Required';
    if (!form.degree) errs.degree = 'Required';
    if (!form.department) errs.department = 'Required';
    if (!form.duration) errs.duration = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = editItem ? `/api/courses/${editItem._id}` : '/api/courses';
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, duration: Number(form.duration), totalFee: Number(form.totalFee) || 0 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editItem ? 'Course updated' : 'Course created');
        setModalOpen(false);
        fetchAll();
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
      const res = await fetch(`/api/courses/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Course deleted');
        setDeleteId(null);
        fetchAll();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = courses.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{courses.length} courses configured</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Course
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Degree</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                [...Array(4)].map((_, i) => (
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
                    <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No courses found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{course.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {course.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {course.degree?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {course.department?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {course.duration} {course.durationUnit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={course.isActive ? 'success' : 'danger'}>
                        {course.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(course)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(course._id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Course' : 'Add New Course'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editItem ? 'Update Course' : 'Create Course'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Course Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
              required
              placeholder="e.g. Bachelor of Computer Applications"
            />
            <Input
              label="Course Code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              error={errors.code}
              required
              placeholder="e.g. BCA"
            />
          </div>
          <Select
            label="Degree"
            value={form.degree}
            onChange={(e) => setForm({ ...form, degree: e.target.value, department: '' })}
            error={errors.degree}
            required
            options={degrees.map((d) => ({ value: d._id, label: `${d.name} (${d.shortName})` }))}
          />
          <Select
            label="Department"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            error={errors.department}
            required
            disabled={!form.degree}
            options={filteredDepts.map((d) => ({ value: d._id, label: d.name }))}
            placeholder={form.degree ? 'Select department' : 'Select degree first'}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration"
              type="number"
              min="1"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              error={errors.duration}
              required
              placeholder="e.g. 3"
            />
            <Select
              label="Duration Unit"
              value={form.durationUnit}
              onChange={(e) => setForm({ ...form, durationUnit: e.target.value })}
              options={[
                { value: 'Years', label: 'Years' },
                { value: 'Months', label: 'Months' },
                { value: 'Semesters', label: 'Semesters' },
              ]}
            />
          </div>
          <Input
            label="Total Fee (₹)"
            type="number"
            min="0"
            value={form.totalFee}
            onChange={(e) => setForm({ ...form, totalFee: e.target.value })}
            placeholder="Total course fee"
          />
          <Select
            label="Status"
            value={form.isActive ? 'true' : 'false'}
            onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Course"
        message="Are you sure you want to delete this course? This may affect enrolled students."
        confirmText="Delete Course"
      />
    </DashboardLayout>
  );
}
