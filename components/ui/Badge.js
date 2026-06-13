'use client';
/**
 * Status Badge component
 */

const variants = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const statusMap = {
  // Student status
  Active: 'success',
  Inactive: 'gray',
  Graduated: 'info',
  Dropped: 'danger',
  Suspended: 'warning',
  // Fee status
  Paid: 'success',
  Partial: 'warning',
  Pending: 'info',
  Overdue: 'danger',
  // User roles
  super_admin: 'purple',
  admin: 'info',
  staff: 'gray',
};

export default function Badge({ children, variant, className = '' }) {
  const resolvedVariant = variant || statusMap[children] || 'gray';
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${variants[resolvedVariant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
