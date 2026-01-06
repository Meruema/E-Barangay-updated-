'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainDashboard } from '@/components/admin/AdminMainDashboard';
import { AdminDirectory } from '@/components/admin/AdminDirectory';
import { AdminRequestManagement } from '@/components/admin/AdminRequestManagement';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/hooks/useAuth';
import { canAccessPage } from '@/lib/auth/canAccess';

// Dynamically import to avoid SSR issues
const AdminDirectoryDynamic = dynamic(
  () =>
    import('@/components/admin/AdminDirectory').then((mod) => ({
      default: mod.AdminDirectory,
    })),
  { ssr: false },
);

const AdminUsersPage = dynamic(
  () => import('./users/page').then((mod) => mod.default),
  { ssr: false },
);

type View = 'dashboard' | 'directory' | 'requests' | 'users';

export default function AdminPage() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [userRole, setUserRole] = useState<
    import('@/lib/auth/canAccess').UserRole | null
  >(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    // Use canAccess utility for role-based access
    if (
      !canAccessPage(
        '/admin',
        user?.role as import('@/lib/auth/canAccess').UserRole,
      )
    ) {
      router.push('/');
      return;
    }
    if (user) {
      setUserRole(user.role as import('@/lib/auth/canAccess').UserRole);
    }
    setLoading(false);
    // Clear post-login flag once auth is loaded
    if (
      typeof window !== 'undefined' &&
      sessionStorage.getItem('isPostLogin')
    ) {
      sessionStorage.removeItem('isPostLogin');
    }
  }, [authLoading, user, router]);

  if (loading || authLoading) {
    const isPostLogin =
      typeof window !== 'undefined' && sessionStorage.getItem('isPostLogin');
    return (
      <div className='min-h-screen bg-gradient-to-b from-blue-50 to-gray-200 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto'></div>
          <p className='mt-6 text-lg font-medium text-gray-900'>
            {isPostLogin ? 'Logging you in...' : 'Loading...'}
          </p>
          {isPostLogin && (
            <p className='mt-2 text-sm text-gray-600'>
              Please wait while we update your session
            </p>
          )}
        </div>
      </div>
    );
  }

  // Remove this check: only 'staff' would see the page, but you now use 'ADMIN' and 'SUPER_ADMIN'.

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <MainDashboard onNavigate={setCurrentView} />;
      case 'directory':
        return <AdminDirectoryDynamic onNavigate={setCurrentView} />;
      case 'requests':
        return <AdminRequestManagement onNavigate={setCurrentView} />;
      case 'users':
        return <AdminUsersPage />;
      default:
        return <MainDashboard onNavigate={setCurrentView} />;
    }
  };

  return <div className='min-h-screen bg-background'>{renderView()}</div>;
}
