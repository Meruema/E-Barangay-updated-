'use client';

import { useState } from 'react';
import { Landmark, User, Menu } from 'lucide-react';
import { useRouterWithProgress } from '@/lib/hooks/useRouterWithProgress';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import axiosInstance from '@/lib/axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SharedHeader() {
  const router = useRouterWithProgress();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLogoutLoading(true);
      await axiosInstance.post('/auth/logout');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (error) {
      console.error('Failed to log out:', error);
      setLogoutLoading(false);
    }
  };

  // Determine navigation based on user role
  const getNavigation = () => {
    // Don't show navigation while loading to prevent security issues
    if (loading) {
      return (
        <nav className='flex items-center space-x-8 text-sm font-medium text-gray-700'>
          <div className='h-5 w-16 bg-gray-200 animate-pulse rounded'></div>
          <div className='h-5 w-16 bg-gray-200 animate-pulse rounded'></div>
          <div className='h-5 w-16 bg-gray-200 animate-pulse rounded'></div>
        </nav>
      );
    }

    if (!user) {
      // Guest navigation
      return (
        <nav className='flex items-center space-x-8 text-sm font-medium text-gray-700'>
          <button
            onClick={() => router.push('/')}
            className={`hover:text-blue-600 transition-colors ${
              pathname === '/' ? 'text-blue-600 font-semibold' : ''
            }`}
          >
            Home
          </button>
          <button
            onClick={() => router.push('/services')}
            className={`hover:text-blue-600 transition-colors ${
              pathname === '/services' ? 'text-blue-600 font-semibold' : ''
            }`}
          >
            Services
          </button>
          <button
            onClick={() => router.push('/facilities')}
            className={`hover:text-blue-600 transition-colors ${
              pathname === '/facilities' ? 'text-blue-600 font-semibold' : ''
            }`}
          >
            Facilities
          </button>
        </nav>
      );
    }

    switch (user.role) {
      case 'SUPER_ADMIN':
        return (
          <nav className='flex items-center space-x-8 text-sm font-medium text-gray-700'>
            <button
              onClick={() => router.push('/super-admin')}
              className={`hover:text-blue-600 transition-colors ${
                pathname === '/super-admin' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/super-admin/users')}
              className={`hover:text-blue-600 transition-colors ${
                pathname?.startsWith('/super-admin/users')
                  ? 'text-blue-600 font-semibold'
                  : ''
              }`}
            >
              Users
            </button>
            <button
              onClick={() => router.push('/super-admin/barangays')}
              className={`hover:text-blue-600 transition-colors ${
                pathname?.startsWith('/super-admin/barangays')
                  ? 'text-blue-600 font-semibold'
                  : ''
              }`}
            >
              Barangays
            </button>
          </nav>
        );

      case 'ADMIN':
        return (
          <nav className='flex items-center space-x-8 text-sm font-medium text-gray-700'>
            <button
              onClick={() => router.push('/admin')}
              className={`hover:text-blue-600 transition-colors ${
                pathname === '/admin' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/admin/directory')}
              className={`hover:text-blue-600 transition-colors ${
                pathname === '/admin/directory'
                  ? 'text-blue-600 font-semibold'
                  : ''
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => router.push('/admin/requests')}
              className={`hover:text-blue-600 transition-colors ${
                pathname === '/admin/requests'
                  ? 'text-blue-600 font-semibold'
                  : ''
              }`}
            >
              Requests
            </button>
            <button
              onClick={() => router.push('/admin/users')}
              className={`hover:text-green-700 transition-colors ${
                pathname === '/admin/users'
                  ? 'text-green-700 font-semibold'
                  : ''
              }`}
            >
              Verify Users
            </button>
          </nav>
        );

      case 'USER':
      default:
        return (
          <nav className='flex items-center space-x-8 text-sm font-medium text-gray-700'>
            <button
              onClick={() => router.push('/user')}
              className={`hover:text-blue-600 transition-colors ${
                pathname === '/user' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => router.push('/services')}
              className={`hover:text-blue-600 transition-colors ${
                pathname === '/services' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Services
            </button>
            <button
              onClick={() => router.push('/facilities')}
              className={`hover:text-blue-600 transition-colors ${
                pathname === '/facilities' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Facilities
            </button>
          </nav>
        );
    }
  };

  const getLogoRoute = () => {
    if (loading || !user) return '/';
    switch (user.role) {
      case 'SUPER_ADMIN':
        return '/super-admin';
      case 'ADMIN':
        return '/admin';
      case 'USER':
      default:
        return '/user';
    }
  };

  return (
    <>
      {/* Logout Loading Overlay */}
      {logoutLoading && (
        <div className='fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-[9999] animate-fadeIn'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          <p className='mt-4 text-lg font-medium text-gray-700'>
            Logging out...
          </p>
          <p className='text-sm text-gray-500'>Please wait.</p>
        </div>
      )}

      <div className='max-w-4xl mx-auto px-6 animate-fadeIn'>
        <div className='flex items-center justify-between rounded-full bg-white px-6 py-3 shadow-sm'>
          {/* Logo + Title */}
          <div
            className='flex items-center space-x-3 cursor-pointer'
            onClick={() => router.push(getLogoRoute())}
          >
            <Landmark className='h-8 w-8 text-blue-800' />
            <h1 className='text-xl font-semibold text-gray-900'>E-Barangay</h1>
          </div>

          {/* Center Navigation - Role Based */}
          {getNavigation()}

          {/* Right Side - User Menu or Login/Signup */}
          <div className='flex items-center space-x-3'>
            {loading ? (
              <Button variant='outline' disabled>
                Loading...
              </Button>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline'>
                    {user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? (
                      <Menu className='h-4 w-4' />
                    ) : (
                      <>
                        <User className='h-4 w-4 mr-2' />
                        {user.email?.split('@')[0] || 'Account'}
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56' align='end'>
                  <DropdownMenuLabel>
                    {user.role === 'SUPER_ADMIN'
                      ? 'Super Admin'
                      : user.role === 'ADMIN'
                      ? 'Admin'
                      : 'My Account'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {user.role === 'USER' && (
                      <>
                        <DropdownMenuItem
                          onClick={() => router.push('/user/requests')}
                        >
                          View All Requests
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={handleSignOut}>
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant='outline' onClick={() => setLoginOpen(true)}>
                  Log In
                </Button>
                <Button onClick={() => setSignupOpen(true)}>Sign Up</Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Login/Signup Modals for Guests */}
      {!user && (
        <>
          <LoginForm
            open={loginOpen}
            onOpenChange={setLoginOpen}
            onSwitchToSignup={() => {
              setLoginOpen(false);
              setSignupOpen(true);
            }}
          />
          <SignupForm
            open={signupOpen}
            onOpenChange={setSignupOpen}
            onSwitchToLogin={() => {
              setSignupOpen(false);
              setLoginOpen(true);
            }}
          />
        </>
      )}
    </>
  );
}
