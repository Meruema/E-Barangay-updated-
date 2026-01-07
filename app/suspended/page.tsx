'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SuspendedPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center p-4'>
      <Card className='max-w-md w-full border-red-200 shadow-lg'>
        <CardHeader className='text-center space-y-4'>
          <div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center'>
            <AlertCircle className='w-10 h-10 text-red-600' />
          </div>
          <CardTitle className='text-2xl font-bold text-red-700'>
            Account Suspended
          </CardTitle>
          <CardDescription className='text-base'>
            Your account has been temporarily suspended
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <p className='text-sm text-gray-700 text-center'>
              Your account is currently suspended. Please visit your barangay
              office for account reactivation.
            </p>
          </div>

          <div className='space-y-2'>
            <h3 className='font-semibold text-sm text-gray-700'>
              What to do next:
            </h3>
            <ul className='text-sm text-gray-600 space-y-1 list-disc list-inside'>
              <li>Visit your barangay office during business hours</li>
              <li>Bring a valid ID for verification</li>
              <li>Speak with the barangay administrator</li>
              <li>Request account reactivation</li>
            </ul>
          </div>

          <Button
            onClick={handleLogout}
            className='w-full bg-red-600 hover:bg-red-700'
          >
            Return to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
