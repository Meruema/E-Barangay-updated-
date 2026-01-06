'use client';

import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { useRouterWithProgress } from '@/lib/hooks/useRouterWithProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
  const router = useRouterWithProgress();

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex items-center justify-center p-6'>
      <Card className='max-w-md w-full shadow-xl'>
        <CardHeader className='text-center pb-4'>
          <div className='flex justify-center mb-4'>
            <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center'>
              <ShieldX className='w-12 h-12 text-red-600' />
            </div>
          </div>
          <CardTitle className='text-2xl font-bold text-gray-900'>
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className='text-center space-y-6'>
          <div className='space-y-2'>
            <p className='text-gray-600'>
              You don't have permission to access this page.
            </p>
            <p className='text-sm text-gray-500'>
              This area is restricted to authorized users only. If you believe
              this is an error, please contact your administrator.
            </p>
          </div>

          <div className='flex flex-col sm:flex-row gap-3 pt-4'>
            <Button
              variant='outline'
              className='flex-1 border-gray-300 hover:bg-gray-100'
              onClick={() => router.back()}
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Go Back
            </Button>
            <Button
              className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
              onClick={() => router.push('/')}
            >
              <Home className='w-4 h-4 mr-2' />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
