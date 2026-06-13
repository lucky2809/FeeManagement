'use client';
/**
 * Add New Student Page
 */
import DashboardLayout from '@/components/layout/DashboardLayout';
import StudentForm from '@/components/students/StudentForm';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export default function AddStudentPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Student added successfully');
        router.push(`/students/${data.data._id}`);
      } else {
        toast.error(data.message || 'Failed to add student');
      }
    } catch {
      toast.error('Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Student</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Fill in the student details below</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <StudentForm onSubmit={handleSubmit} loading={loading} submitLabel="Add Student" />
        </div>
      </div>
    </DashboardLayout>
  );
}
