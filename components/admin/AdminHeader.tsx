import { Menu, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';
import { useRouterWithProgress } from '@/lib/hooks/useRouterWithProgress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

interface HeaderProps {
  onNavigate: (view: 'dashboard' | 'directory' | 'requests' | 'users') => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const router = useRouterWithProgress();
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
    <div className='max-w-4xl mx-auto px-6'>
      <div className='flex items-center justify-between rounded-full bg-white px-6 py-3 shadow-sm'>
        {/* Logo + Title */}
        <div
          className='flex items-center space-x-3 cursor-pointer'
          onClick={() => onNavigate('dashboard')}
        >
          <Landmark className='h-8 w-8 text-blue-800' />
          <h1 className='text-xl font-semibold text-gray-900 px-6'>
            E-Barangay
          </h1>
        </div>

        {/* Center Navigation */}
        <nav className='flex items-center space-x-8 text-sm font-medium text-gray-700'>
          <button
            onClick={() => onNavigate('dashboard')}
            className='hover:text-blue-600'
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('directory')}
            className='hover:text-blue-600'
          >
            Edit
          </button>
          <button
            onClick={() => onNavigate('requests')}
            className='hover:text-blue-600'
          >
            Requests
          </button>
          <button
            onClick={() => onNavigate('users')}
            className='hover:text-green-700 -pl-6 pr-6'
          >
            Verify Users
          </button>
        </nav>

        {/* Right Side Buttons */}
        <div className='flex items-center space-x-3'>
          <DropdownMenu>
            <DropdownMenuContent className='w-30' align='start'>
              <DropdownMenuLabel>Sign in</DropdownMenuLabel>
              <DropdownMenuLabel>Log in</DropdownMenuLabel>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant='outline'>
                <Menu className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56' align='start'>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleSignOut}>
                  {' '}
                  Log Out{' '}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
