'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { canAccessPage } from '@/lib/auth/canAccess';
import { useRouterWithProgress } from '@/lib/hooks/useRouterWithProgress';
import { SharedHeader } from '@/components/SharedHeader';
import { MainDashboard } from '@/components/admin/AdminMainDashboard';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouterWithProgress();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    
    if (
      !canAccessPage(
        '/admin',
        user?.role as import('@/lib/auth/canAccess').UserRole,
      )
    ) {
      router.push('/');
      return;
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

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-gray-200'>
      <div className='py-6'>
        <SharedHeader />
      </div>
      <MainDashboard />
    </div>
  );
}
