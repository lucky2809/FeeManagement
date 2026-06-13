'use client';
/**
 * Sidebar Navigation Component
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Building2,
  CreditCard,
  UserCircle,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'admin', 'staff'],
  },
  {
    label: 'Students',
    href: '/students',
    icon: GraduationCap,
    roles: ['super_admin', 'admin', 'staff'],
  },
  {
    label: 'Courses',
    href: '/courses',
    icon: BookOpen,
    roles: ['super_admin', 'admin'],
    children: [
      { label: 'All Courses', href: '/courses' },
      { label: 'Degrees', href: '/courses/degrees' },
      { label: 'Departments', href: '/courses/departments' },
    ],
  },
  {
    label: 'Fee Management',
    href: '/fees',
    icon: DollarSign,
    roles: ['super_admin', 'admin'],
    children: [
      { label: 'Fee Records', href: '/fees' },
      { label: 'Payments', href: '/fees/payments' },
      { label: 'Pending Fees', href: '/fees/pending' },
    ],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['super_admin', 'admin'],
  },
  {
    label: 'User Management',
    href: '/users',
    icon: Users,
    roles: ['super_admin', 'admin'],
  },
];

function NavItem({ item, user, onClose }) {
  const pathname = usePathname();
  const Icon = item.icon;

  if (!item.roles.includes(user?.role)) return null;

  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <li>
      <Link
        href={item.href}
        onClick={onClose}
        className={`
          flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
          ${isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          }
        `}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1">{item.label}</span>
        {isActive && <ChevronRight className="w-4 h-4" />}
      </Link>

      {/* Submenu */}
      {item.children && isActive && (
        <ul className="ml-9 mt-1 space-y-1">
          {item.children.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                onClick={onClose}
                className={`
                  block px-3 py-2 rounded-lg text-xs font-medium transition-colors
                  ${pathname === child.href
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const roleLabels = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    staff: 'Staff',
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-64
          bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          flex flex-col
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">College ERP</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Management System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <NavItem key={item.href} item={item} user={user} onClose={onClose} />
            ))}
          </ul>
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mb-2"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <UserCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabels[user?.role]}</p>
            </div>
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
