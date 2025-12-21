'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainDashboard } from '@/components/admin/AdminMainDashboard';
import { AdminDirectory } from '@/components/admin/AdminDirectory';
import { AdminRequestManagement } from '@/components/admin/AdminRequestManagement';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/hooks/useAuth';

// Dynamically import to avoid SSR issues
const AdminDirectoryDynamic = dynamic(
  () =>
    import('@/components/admin/AdminDirectory').then((mod) => ({
      default: mod.AdminDirectory,
    })),
  { ssr: false },
);

type View = 'dashboard' | 'directory' | 'requests';

export default function AdminPage() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    // Allow only ADMIN and SUPER_ADMIN roles
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      router.push('/');
      return;
    }
    setUserRole(user.role);
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
      default:
        return <MainDashboard onNavigate={setCurrentView} />;
    }
  };

  return <div className='min-h-screen bg-background'>{renderView()}</div>;
}
