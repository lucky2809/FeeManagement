'use client';
/**
 * Degrees Management Page
 */
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', shortName: '', description: '', totalYears: '', isActive: true };

export default function DegreesPage() {
  const [degrees, setDegrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDegrees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/degrees');
      const data = await res.json();
      if (data.success) setDegrees(data.data);
    } catch {
      toast.error('Failed to load degrees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDegrees(); }, [fetchDegrees]);

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
      shortName: item.shortName,
      description: item.description || '',
      totalYears: item.duration?.toString() || '',
      isActive: item.isActive !== false,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.shortName.trim()) errs.shortName = 'Required';
    if (!form.totalYears) errs.totalYears = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = editItem ? `/api/degrees/${editItem._id}` : '/api/degrees';
      const method = editItem ? 'PUT' : 'POST';
      const { totalYears, ...rest } = form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rest, duration: Number(totalYears) }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editItem ? 'Degree updated' : 'Degree created');
        setModalOpen(false);
        fetchDegrees();
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
      const res = await fetch(`/api/degrees/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Degree deleted');
        setDeleteId(null);
        fetchDegrees();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Degrees</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{degrees.length} degrees configured</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Degree
        </Button>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse border border-gray-200 dark:border-gray-700">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : degrees.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <GraduationCap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No degrees yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add your first degree to get started</p>
          <Button className="mt-4" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Degree
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {degrees.map((degree) => (
            <div
              key={degree._id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{degree.name}</h3>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                      {degree.shortName}
                    </span>
                  </div>
                </div>
                <Badge variant={degree.isActive ? 'success' : 'danger'}>
                  {degree.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {degree.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{degree.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                <span>{degree.duration} Year{degree.duration !== 1 ? 's' : ''} Program</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(degree)}
                    className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(degree._id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Degree' : 'Add New Degree'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editItem ? 'Update' : 'Create Degree'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Degree Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            required
            placeholder="e.g. Bachelor of Computer Applications"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Short Name"
              value={form.shortName}
              onChange={(e) => setForm({ ...form, shortName: e.target.value.toUpperCase() })}
              error={errors.shortName}
              required
              placeholder="e.g. BCA"
            />
            <Input
              label="Total Years"
              type="number"
              min="1"
              max="10"
              value={form.totalYears}
              onChange={(e) => setForm({ ...form, totalYears: e.target.value })}
              error={errors.totalYears}
              required
              placeholder="e.g. 3"
            />
          </div>
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description"
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
        title="Delete Degree"
        message="This will delete the degree. This may affect associated courses and students."
        confirmText="Delete Degree"
      />
    </DashboardLayout>
  );
}
