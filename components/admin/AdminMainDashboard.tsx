'use client';

import { Header } from './AdminHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { getStatistics } from '@/lib/api/statistics';
import { useEffect, useState } from 'react';
import { getAllRequests } from '@/lib/api/requests';
import { TrendingUp } from 'lucide-react';
import Footer from '../Footer';

interface MainDashboardProps {
  onNavigate: (view: 'dashboard' | 'directory' | 'requests' | 'users') => void;
}

export function MainDashboard({ onNavigate }: MainDashboardProps) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const statistics = await getStatistics();
        setStats(statistics);

        // Load only first 3 requests
        const all = await getAllRequests();
        setRecentRequests(all.slice(0, 3));
      } catch (error) {
        console.error('Failed to load statistics:', error);
      }
    }
    loadStats();
  }, []);

  const [recentRequests, setRecentRequests] = useState<Array<any>>([]);

  return (
    <div>
      <div className='min-h-screen bg-gradient-to-b from-blue-50 to-gray-200 p-6 rounded-lg m-5'>
        <Header onNavigate={onNavigate} />

        <main className='max-w-7xl mx-auto px-4 py-8'>
          {/* Hero Section */}
          <div className='items-center pd-10 md:p-10 text-center'>
            <h1 className='text-4xl font-bold text-gray-900'>
              Welcome, Admin!
            </h1>
            <p className='mt-4 text-lg text-gray-600'>
              Manage your barangay's services and facilities with ease. <br />
              Add, remove, or review user requests anytime.
            </p>

            <div className='mt-6 flex justify-center gap-4'>
              <button
                onClick={() =>
                  document
                    .getElementById('requests')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition'
              >
                Get started
              </button>
            </div>
          </div>

          <div id='requests' className='grid lg:grid-cols-1 gap-8'>
            {/* Main Content */}
            <div className='lg:col-span-1'>
              {/* Service Categories */}
              {/* Recent Requests Section (Card Based) */}
              <div className='mb-8 bg-white p-6 rounded-lg shadow-md'>
                <div className='flex items-center justify-between mb-4'>
                  <h2 className='text-2xl font-semibold'>Recent Requests</h2>

                  <Button
                    variant='outline'
                    onClick={() => onNavigate('requests')}
                  >
                    View All
                  </Button>
                </div>

                {/* Scrollable Cards */}
                <div className='space-y-4 max-h-72 overflow-y-auto pr-2'>
                  {recentRequests.length === 0 && (
                    <Card className='p-4 text-center text-gray-500'>
                      No recent requests
                    </Card>
                  )}

                  {recentRequests.map((req) => (
                    <Card
                      key={req.id}
                      className='cursor-pointer hover:shadow-lg transition'
                      onClick={() => onNavigate('requests')}
                    >
                      <CardHeader className='pb-2'>
                        <div className='flex justify-between items-start'>
                          <div>
                            <CardTitle className='text-base'>
                              {req.item?.name || 'Unknown Service'}
                            </CardTitle>
                            <CardDescription className='text-sm'>
                              {req.user?.fullName || req.user?.email}
                            </CardDescription>
                          </div>

                          {/* Status Badge */}
                          <Badge
                            variant='outline'
                            className={
                              req.status === 'pending'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : req.status === 'approved'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }
                          >
                            {req.status}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className='pt-0 pb-3'>
                        <p className='text-xs text-muted-foreground'>
                          Submitted:{' '}
                          {new Date(req.submittedAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <div>
        {' '}
        <Footer />{' '}
      </div>
    </div>
  );
}
