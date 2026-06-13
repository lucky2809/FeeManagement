'use client';
/**
 * Student Form - used for both Add and Edit
 */
import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

const currentYear = new Date().getFullYear();

export default function StudentForm({ initialData = {}, onSubmit, loading, submitLabel = 'Save Student' }) {
  const [form, setForm] = useState({
    fullName: '',
    fatherName: '',
    motherName: '',
    mobileNumber: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    enrollmentNumber: '',
    registrationNumber: '',
    degree: '',
    course: '',
    department: '',
    admissionYear: currentYear.toString(),
    currentYear: '1',
    currentSemester: '1',
    status: 'Active',
    ...initialData,
    // Normalize populated objects to IDs
    degree: initialData.degree?._id || initialData.degree || '',
    course: initialData.course?._id || initialData.course || '',
    department: initialData.department?._id || initialData.department || '',
    dateOfBirth: initialData.dateOfBirth
      ? new Date(initialData.dateOfBirth).toISOString().split('T')[0]
      : '',
  });

  const [degrees, setDegrees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [errors, setErrors] = useState({});

  // Load degrees on mount
  useEffect(() => {
    fetch('/api/degrees?active=true')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setDegrees(d.data);
      });
  }, []);

  // Load departments when degree changes
  useEffect(() => {
    if (!form.degree) {
      setDepartments([]);
      setCourses([]);
      return;
    }
    fetch(`/api/departments?degree=${form.degree}&active=true`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setDepartments(d.data);
      });
  }, [form.degree]);

  // Load courses when degree+department changes
  useEffect(() => {
    if (!form.degree || !form.department) {
      setCourses([]);
      return;
    }
    fetch(`/api/courses?degree=${form.degree}&department=${form.department}&active=true`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCourses(d.data);
      });
  }, [form.degree, form.department]);

  const update = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Reset cascading fields
      if (field === 'degree') {
        updated.department = '';
        updated.course = '';
      }
      if (field === 'department') {
        updated.course = '';
      }
      return updated;
    });
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    const required = [
      'fullName', 'fatherName', 'motherName', 'mobileNumber', 'dateOfBirth',
      'gender', 'address', 'city', 'state', 'enrollmentNumber', 'degree',
      'course', 'department', 'admissionYear', 'currentYear',
    ];
    required.forEach((f) => {
      if (!form[f]) errs[f] = 'This field is required';
    });
    if (form.mobileNumber && !/^[0-9]{10}$/.test(form.mobileNumber)) {
      errs.mobileNumber = 'Enter a valid 10-digit mobile number';
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the form errors');
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Information */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Full Name"
            value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            error={errors.fullName}
            required
            placeholder="Enter full name"
          />
          <Input
            label="Father's Name"
            value={form.fatherName}
            onChange={(e) => update('fatherName', e.target.value)}
            error={errors.fatherName}
            required
            placeholder="Enter father's name"
          />
          <Input
            label="Mother's Name"
            value={form.motherName}
            onChange={(e) => update('motherName', e.target.value)}
            error={errors.motherName}
            required
            placeholder="Enter mother's name"
          />
          <Input
            label="Mobile Number"
            value={form.mobileNumber}
            onChange={(e) => update('mobileNumber', e.target.value)}
            error={errors.mobileNumber}
            required
            placeholder="10-digit mobile number"
            maxLength={10}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            error={errors.email}
            placeholder="student@email.com"
          />
          <Input
            label="Date of Birth"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => update('dateOfBirth', e.target.value)}
            error={errors.dateOfBirth}
            required
          />
          <Select
            label="Gender"
            value={form.gender}
            onChange={(e) => update('gender', e.target.value)}
            error={errors.gender}
            required
            options={[
              { value: 'Male', label: 'Male' },
              { value: 'Female', label: 'Female' },
              { value: 'Other', label: 'Other' },
            ]}
          />
          <div className="sm:col-span-2">
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              error={errors.address}
              required
              placeholder="Full address"
            />
          </div>
          <Input
            label="City"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            error={errors.city}
            required
            placeholder="City"
          />
          <Select
            label="State"
            value={form.state}
            onChange={(e) => update('state', e.target.value)}
            error={errors.state}
            required
            options={STATES.map((s) => ({ value: s, label: s }))}
          />
        </div>
      </section>

      {/* Academic Information */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
          Academic Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Enrollment Number"
            value={form.enrollmentNumber}
            onChange={(e) => update('enrollmentNumber', e.target.value.toUpperCase())}
            error={errors.enrollmentNumber}
            required
            placeholder="e.g. BCA2024001"
          />
          <Input
            label="Registration Number"
            value={form.registrationNumber}
            onChange={(e) => update('registrationNumber', e.target.value.toUpperCase())}
            placeholder="Registration number (optional)"
          />
          <Select
            label="Degree"
            value={form.degree}
            onChange={(e) => update('degree', e.target.value)}
            error={errors.degree}
            required
            options={degrees.map((d) => ({ value: d._id, label: `${d.name} (${d.shortName})` }))}
          />
          <Select
            label="Department"
            value={form.department}
            onChange={(e) => update('department', e.target.value)}
            error={errors.department}
            required
            disabled={!form.degree}
            options={departments.map((d) => ({ value: d._id, label: d.name }))}
            placeholder={form.degree ? 'Select department' : 'Select degree first'}
          />
          <Select
            label="Course"
            value={form.course}
            onChange={(e) => update('course', e.target.value)}
            error={errors.course}
            required
            disabled={!form.department}
            options={courses.map((c) => ({ value: c._id, label: `${c.name} (${c.code})` }))}
            placeholder={form.department ? 'Select course' : 'Select department first'}
          />
          <Select
            label="Admission Year"
            value={form.admissionYear}
            onChange={(e) => update('admissionYear', e.target.value)}
            error={errors.admissionYear}
            required
            options={Array.from({ length: 10 }, (_, i) => ({
              value: (currentYear - i).toString(),
              label: (currentYear - i).toString(),
            }))}
          />
          <Select
            label="Current Year"
            value={form.currentYear}
            onChange={(e) => update('currentYear', e.target.value)}
            error={errors.currentYear}
            required
            options={Array.from({ length: 6 }, (_, i) => ({
              value: (i + 1).toString(),
              label: `Year ${i + 1}`,
            }))}
          />
          <Select
            label="Current Semester"
            value={form.currentSemester}
            onChange={(e) => update('currentSemester', e.target.value)}
            options={Array.from({ length: 8 }, (_, i) => ({
              value: (i + 1).toString(),
              label: `Semester ${i + 1}`,
            }))}
          />
          <Select
            label="Student Status"
            value={form.status}
            onChange={(e) => update('status', e.target.value)}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
              { value: 'Graduated', label: 'Graduated' },
              { value: 'Dropped', label: 'Dropped' },
              { value: 'Suspended', label: 'Suspended' },
            ]}
          />
        </div>
      </section>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
