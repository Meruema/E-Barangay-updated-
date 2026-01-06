'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, User } from 'lucide-react';
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

export function Header() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLogoutLoading(true); // SHOW LOADING OVERLAY
      await axiosInstance.post('/auth/logout');

      setTimeout(() => {
        window.location.reload(); // HARD RELOAD
      }, 1200);
    } catch (error) {
      console.error('Failed to log out:', error);
      setLogoutLoading(false);
    }
  };

  return (
    <>
      {/* 🔵 LOGOUT LOADING OVERLAY */}
      {logoutLoading && (
        <div className='fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-[9999] animate-fadeIn'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          <p className='mt-4 text-lg font-medium text-gray-700'>
            Logging out...
          </p>
          <p className='text-sm text-gray-500'>Please wait.</p>
        </div>
      )}

      <div className='max-w-4xl mx-auto px-6'>
        <div className='flex items-center justify-between rounded-full bg-white px-6 py-3 shadow-sm'>
          {/* Logo + Title */}
          <div
            className='flex items-center space-x-3 cursor-pointer'
            onClick={() => router.push('/dashboard')}
          >
            <Landmark className='h-8 w-8 text-blue-800' />
            <h1 className='text-xl font-semibold text-gray-900'>E-Barangay</h1>
          </div>

          {/* Center Navigation */}
          <nav className='flex items-center space-x-8 text-sm font-medium text-gray-700'>
            <button
              onClick={() => router.push('/dashboard')}
              className='hover:text-blue-600'
            >
              Home
            </button>
            <button
              onClick={() => router.push('/services')}
              className='hover:text-blue-600'
            >
              Services
            </button>
            <button
              onClick={() => router.push('/facilities')}
              className='hover:text-blue-600'
            >
              Facilities
            </button>
          </nav>

          {/* Right Side Buttons */}
          <div className='flex items-center space-x-3'>
            {loading ? (
              <Button variant='outline' disabled>
                Loading...
              </Button>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant='outline'>
                    <User className='h-4 w-4 mr-2' />
                    {user.email?.split('@')[0] || 'Account'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56' align='end'>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push('/requests')}>
                      View All Requests
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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
  );
}
