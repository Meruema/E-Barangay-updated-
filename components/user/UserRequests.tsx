'use client';

import { useEffect, useState } from 'react';
import { Header } from './UserHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserRequests } from '@/lib/api/requests';
import { RequestWithDetails } from '@/lib/database.types';
import Footer from '../Footer';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface UserRequestsProps {
  onNavigate: (
    view: 'dashboard' | 'services' | 'facilities' | 'application' | 'requests',
  ) => void;
}

export function UserRequests({ onNavigate }: UserRequestsProps) {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRequests = await getUserRequests(user.id);
        setRequests(userRequests);
      } catch (error) {
        console.error('Failed to load requests:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'rejected':
        return <XCircle className='h-4 w-4 text-red-600' />;
      case 'pending':
        return <Clock className='h-4 w-4 text-yellow-600' />;
      default:
        return <AlertCircle className='h-4 w-4 text-gray-600' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold mb-4'>Please log in</h2>
          <p className='text-gray-600 mb-4'>
            You need to be logged in to view your requests.
          </p>
          <button
            onClick={() => onNavigate('dashboard')}
            className='text-blue-600 hover:underline'
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className='min-h-screen bg-gradient-to-b from-blue-50 to-gray-200 p-6 rounded-lg m-5'>
        <Header />

        <main className='max-w-7xl mx-auto px-4 py-8'>
          <div className='mb-6'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              My Requests
            </h1>
            <p className='text-gray-600'>
              View and track all your service and facility requests
            </p>
          </div>

          {requests.length === 0 ? (
            <Card>
              <CardContent className='py-12 text-center'>
                <p className='text-gray-600 mb-4'>
                  You haven't submitted any requests yet.
                </p>
                <button
                  onClick={() => onNavigate('services')}
                  className='text-blue-600 hover:underline'
                >
                  Browse Services
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-4'>
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <CardTitle className='text-xl mb-2'>
                          {request.item?.name || 'Unknown Item'}
                        </CardTitle>
                        <CardDescription>
                          {request.item?.description || 'No description'}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        <span className='flex items-center gap-1'>
                          {getStatusIcon(request.status)}
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                        </span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      <div className='text-sm text-gray-600'>
                        <strong>Submitted:</strong>{' '}
                        {new Date(request.submitted_at).toLocaleDateString()}
                      </div>
                      {request.reason && (
                        <div className='text-sm text-gray-600'>
                          <strong>Reason:</strong> {request.reason}
                        </div>
                      )}
                      {request.actions && request.actions.length > 0 && (
                        <div className='mt-4 pt-4 border-t'>
                          <h4 className='font-semibold mb-2'>
                            Activity History
                          </h4>
                          <div className='space-y-2'>
                            {request.actions.map((action) => (
                              <div
                                key={action.id}
                                className='text-sm text-gray-600'
                              >
                                <span className='font-medium'>
                                  {action.action_type}:
                                </span>{' '}
                                {new Date(
                                  action.action_date,
                                ).toLocaleDateString()}
                                {action.remarks && (
                                  <span className='ml-2'>
                                    - {action.remarks}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
