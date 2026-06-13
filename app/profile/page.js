'use client';
/**
 * User Profile Page
 */
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Lock, Shield, Clock, Eye, EyeOff, Camera } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  staff: 'Staff',
};

const ROLE_COLORS = {
  super_admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  admin: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  staff: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function ProfilePage() {
  const { user, updateProfile, refreshUser } = useAuth();

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync form fields when user data loads (user starts as null on page load)
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  const validateProfile = () => {
    const errs = {};
    if (!profileForm.name.trim()) errs.name = 'Name is required';
    if (!profileForm.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(profileForm.email)) errs.email = 'Invalid email';
    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProfileSave = async () => {
    if (!validateProfile()) return;
    setSavingProfile(true);
    try {
      const result = await updateProfile({ name: profileForm.name, email: profileForm.email });
      if (!result.success) toast.error(result.error || 'Update failed');
    } catch {
      toast.error('Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const validatePassword = () => {
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Required';
    if (!pwForm.newPassword) errs.newPassword = 'Required';
    else {
      const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!pwRegex.test(pwForm.newPassword)) {
        errs.newPassword = 'Min 8 chars with uppercase, lowercase, number, special char';
      }
    }
    if (!pwForm.confirmPassword) errs.confirmPassword = 'Required';
    else if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePassword()) return;
    setSavingPw(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password changed successfully');
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPwErrors({});
      } else {
        toast.error(data.message || 'Password change failed');
      }
    } catch {
      toast.error('Password change failed');
    } finally {
      setSavingPw(false);
    }
  };

  const togglePw = (field) => setShowPw((prev) => ({ ...prev, [field]: !prev[field] }));

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account settings and password</p>
        </div>

        {/* Profile Overview Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{user?.name}</h2>
              <p className="text-blue-100 text-sm truncate">{user?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20`}>
                  <Shield className="w-3 h-3" />
                  {ROLE_LABELS[user?.role] || user?.role}
                </span>
                {user?.lastLogin && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-100">
                    <Clock className="w-3 h-3" />
                    Last login: {format(new Date(user.lastLogin), 'dd MMM yyyy, HH:mm')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Personal Details</h3>
            </div>

            <div className="space-y-4">
              <Input
                label="Full Name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                error={profileErrors.name}
                required
                placeholder="Your full name"
              />
              <Input
                label="Email Address"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                error={profileErrors.email}
                required
                placeholder="Your email address"
              />

              {/* Read-only info */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[user?.role]}`}>
                    {ROLE_LABELS[user?.role]}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Member Since</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user?.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Last Login</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user?.lastLogin ? format(new Date(user.lastLogin), 'dd MMM yyyy, HH:mm') : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleProfileSave} loading={savingProfile}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Lock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Change Password</h3>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Input
                  label="Current Password"
                  type={showPw.current ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  error={pwErrors.currentPassword}
                  required
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => togglePw('current')}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="New Password"
                  type={showPw.new ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  error={pwErrors.newPassword}
                  required
                  placeholder="Min 8 chars, mixed + number + symbol"
                />
                <button
                  type="button"
                  onClick={() => togglePw('new')}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPw.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirm New Password"
                  type={showPw.confirm ? 'text' : 'password'}
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  error={pwErrors.confirmPassword}
                  required
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => togglePw('confirm')}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password requirements */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p className="font-medium text-gray-700 dark:text-gray-300">Password requirements:</p>
                {[
                  { label: 'At least 8 characters', test: pwForm.newPassword.length >= 8 },
                  { label: 'One uppercase letter (A-Z)', test: /[A-Z]/.test(pwForm.newPassword) },
                  { label: 'One lowercase letter (a-z)', test: /[a-z]/.test(pwForm.newPassword) },
                  { label: 'One number (0-9)', test: /\d/.test(pwForm.newPassword) },
                  { label: 'One special character (@$!%*?&#)', test: /[@$!%*?&#]/.test(pwForm.newPassword) },
                ].map(({ label, test }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={test ? 'text-green-500' : 'text-gray-400'}>
                      {test ? '✓' : '○'}
                    </span>
                    <span className={test ? 'text-green-600 dark:text-green-400' : ''}>{label}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handlePasswordChange} loading={savingPw} variant="warning">
                  Change Password
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
