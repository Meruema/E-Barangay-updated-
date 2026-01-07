'use client';

import { useState } from 'react';
import { useRouterWithProgress } from '@/lib/hooks/useRouterWithProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { signIn } from '@/app/actions/auth';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
interface LoginFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignup: () => void;
}

export function LoginForm({
  open,
  onOpenChange,
  onSwitchToSignup,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);

  const router = useRouterWithProgress();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await signIn(email, password);

      if (result.error) {
        toast.error(result.error);
      } else {
        setEmail('');
        setPassword('');

        // show full-screen loading overlay
        setShowLoadingScreen(true);

        let targetUrl = '/user'; // Default to user dashboard
        if (result.role === 'SUPER_ADMIN') {
          targetUrl = '/super-admin';
        } else if (result.role === 'ADMIN') {
          targetUrl = '/admin';
        }
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 1500);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <>
      {/* FULLSCREEN LOADING SCREEN */}
      {showLoadingScreen && (
        <div className='fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-[9999] animate-fadeIn'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          <p className='mt-4 text-lg font-medium text-gray-700'>
            Logging in...
          </p>
          <p className='text-sm text-gray-500'>
            Please wait while we redirect you.
          </p>
        </div>
      )}

      {/* LOGIN MODAL */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Log In</DialogTitle>
            <DialogDescription>
              Enter your credentials to access your account
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='your@email.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className='space-y-2'>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='pr-10'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <div
                    className={`transition-all duration-300 ${
                      showPassword
                        ? 'animate-[spin_0.3s_ease-in-out] scale-110'
                        : 'animate-[wiggle_0.3s_ease-in-out]'
                    }`}
                    style={{
                      animation: showPassword
                        ? 'eyeOpen 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                        : 'eyeClose 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    }}
                  >
                    {showPassword ? (
                      <Eye className='h-5 w-5' />
                    ) : (
                      <EyeOff className='h-5 w-5' />
                    )}
                  </div>
                </button>
              </div>
            </div>

            <style jsx>{`
              @keyframes eyeOpen {
                0% {
                  transform: scale(0.8) rotate(-20deg);
                  opacity: 0.5;
                }
                50% {
                  transform: scale(1.2) rotate(10deg);
                }
                100% {
                  transform: scale(1) rotate(0deg);
                  opacity: 1;
                }
              }

              @keyframes eyeClose {
                0% {
                  transform: scale(1.1) rotate(10deg);
                  opacity: 1;
                }
                50% {
                  transform: scale(0.9) rotate(-5deg);
                }
                100% {
                  transform: scale(1) rotate(0deg);
                  opacity: 1;
                }
              }
            `}</style>

            <Button type='submit' className='w-full'>
              Log In
            </Button>

            <div className='text-center text-sm'>
              <span className='text-gray-600'>Don't have an account? </span>
              <button
                type='button'
                onClick={onSwitchToSignup}
                className='text-blue-600 hover:underline'
              >
                Sign up
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
