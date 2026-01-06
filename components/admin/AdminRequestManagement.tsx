'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { getAllRequests, updateRequestStatus } from '@/lib/api/requests';
import { getCurrentUser } from '@/app/actions/auth';
import { toast } from 'sonner';
import { Clock, CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react';
import Footer from '../Footer';

interface AdminRequestManagementProps {
  onNavigate: (view: 'dashboard' | 'directory' | 'requests' | 'users') => void;
}

export function AdminRequestManagement({
  onNavigate,
}: AdminRequestManagementProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [adminBarangayId, setAdminBarangayId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUserId(user.id);
          // For admins, get their barangayId
          if (user.role === 'ADMIN' && user.barangay && user.barangay.id) {
            setAdminBarangayId(user.barangay.id);
          }
        }
        // Only fetch requests for the admin's barangay
        let data = [];
        if (
          user &&
          user.role === 'ADMIN' &&
          user.barangay &&
          user.barangay.id
        ) {
          data = await getAllRequests(user.barangay.id);
        } else {
          data = await getAllRequests();
        }
        setRequests(data);
      } catch (error) {
        console.error('Failed to load requests:', error);
        toast.error('Failed to load requests');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAction = async (request: any, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setRemarks('');
    setActionDialogOpen(true);
  };

  const submitAction = async () => {
    if (!selectedRequest || !currentUserId) return;

    setProcessing(true);
    try {
      const status = actionType === 'approve' ? 'approved' : 'rejected';
      await updateRequestStatus(
        selectedRequest.id,
        status,
        currentUserId,
        remarks,
      );

      toast.success(
        `Request ${
          actionType === 'approve' ? 'approved' : 'rejected'
        } successfully`,
      );
      setActionDialogOpen(false);

      // Reload requests
      const data = await getAllRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to update request:', error);
      toast.error('Failed to update request');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge
            variant='outline'
            className='bg-yellow-50 text-yellow-700 border-yellow-200'
          >
            <Clock className='w-3 h-3 mr-1' />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge
            variant='outline'
            className='bg-green-50 text-green-700 border-green-200'
          >
            <CheckCircle className='w-3 h-3 mr-1' />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge
            variant='outline'
            className='bg-red-50 text-red-700 border-red-200'
          >
            <XCircle className='w-3 h-3 mr-1' />
            Rejected
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge
            variant='outline'
            className='bg-gray-50 text-gray-700 border-gray-200'
          >
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const otherRequests = requests.filter((r) => r.status !== 'pending');

  if (loading) {
    return (
      <div className='min-h-screen bg-background'>
        <Header onNavigate={onNavigate} />
        <div className='container mx-auto px-4 py-8'>
          <div className='text-center'>Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <div className='min-h-screen bg-background'>
        <Header onNavigate={onNavigate} />
        <div className='container mx-auto px-4 py-8'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold mb-2'>Request Management</h1>
            <p className='text-muted-foreground'>
              Manage and review service requests from residents
            </p>
          </div>

          {/* Pending Requests Section */}
          {pendingRequests.length > 0 && (
            <div className='mb-8'>
              <h2 className='text-2xl font-semibold mb-4'>
                Pending Requests ({pendingRequests.length})
              </h2>
              <div className='grid gap-4'>
                {pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className='flex justify-between items-start'>
                        <div>
                          <CardTitle>
                            {request.item?.name || 'Unknown Service'}
                          </CardTitle>
                          <CardDescription>
                            Requested by:{' '}
                            {request.user?.fullName ||
                              request.user?.email ||
                              'Unknown User'}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-2'>
                        <div>
                          <Label className='text-sm font-medium'>
                            Category:
                          </Label>
                          <p className='text-sm text-muted-foreground'>
                            {request.item?.category?.name || 'N/A'}
                          </p>
                        </div>
                        {request.reason && (
                          <div>
                            <Label className='text-sm font-medium'>
                              Reason:
                            </Label>
                            <p className='text-sm text-muted-foreground'>
                              {request.reason}
                            </p>
                          </div>
                        )}
                        <div>
                          <Label className='text-sm font-medium'>
                            Submitted:
                          </Label>
                          <p className='text-sm text-muted-foreground'>
                            {new Date(request.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className='flex gap-2 mt-4'>
                          <Button
                            onClick={() => handleAction(request, 'approve')}
                            className='bg-green-600 hover:bg-green-700'
                          >
                            <CheckCircle className='w-4 h-4 mr-2' />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleAction(request, 'reject')}
                            variant='destructive'
                          >
                            <XCircle className='w-4 h-4 mr-2' />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Other Requests Section */}
          {otherRequests.length > 0 && (
            <div>
              <h2 className='text-2xl font-semibold mb-4'>
                All Requests ({otherRequests.length})
              </h2>
              <div className='grid gap-4'>
                {otherRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className='flex justify-between items-start'>
                        <div>
                          <CardTitle>
                            {request.item?.name || 'Unknown Service'}
                          </CardTitle>
                          <CardDescription>
                            Requested by:{' '}
                            {request.user?.username ||
                              request.user?.email ||
                              'Unknown User'}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-2'>
                        <div>
                          <Label className='text-sm font-medium'>
                            Category:
                          </Label>
                          <p className='text-sm text-muted-foreground'>
                            {request.item?.category?.name || 'N/A'}
                          </p>
                        </div>
                        {request.reason && (
                          <div>
                            <Label className='text-sm font-medium'>
                              Reason:
                            </Label>
                            <p className='text-sm text-muted-foreground'>
                              {request.reason}
                            </p>
                          </div>
                        )}
                        {request.actions && request.actions.length > 0 && (
                          <div>
                            <Label className='text-sm font-medium'>
                              Actions:
                            </Label>
                            <div className='mt-2 space-y-1'>
                              {request.actions.map(
                                (action: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className='text-sm text-muted-foreground border-l-2 pl-2'
                                  >
                                    <span className='font-medium'>
                                      {action.actionType}
                                    </span>
                                    {action.remarks && (
                                      <span> - {action.remarks}</span>
                                    )}
                                    <span className='text-xs ml-2'>
                                      (
                                      {new Date(
                                        action.actionDate,
                                      ).toLocaleString()}
                                      )
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                        <div>
                          <Label className='text-sm font-medium'>
                            Submitted:
                          </Label>
                          <p className='text-sm text-muted-foreground'>
                            {new Date(request.submittedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {requests.length === 0 && (
            <Card>
              <CardContent className='py-8 text-center text-muted-foreground'>
                No requests found
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve'
                  ? 'Approve Request'
                  : 'Reject Request'}
              </DialogTitle>
              <DialogDescription>
                {selectedRequest && (
                  <>
                    {actionType === 'approve'
                      ? `Approve request for "${
                          selectedRequest.item?.name || 'Unknown Service'
                        }"?`
                      : `Reject request for "${
                          selectedRequest.item?.name || 'Unknown Service'
                        }"?`}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <Label htmlFor='remarks'>Remarks (Optional)</Label>
                <Textarea
                  id='remarks'
                  placeholder='Add any remarks or notes...'
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setActionDialogOpen(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={submitAction}
                disabled={processing}
                className={
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : ''
                }
                variant={actionType === 'reject' ? 'destructive' : 'default'}
              >
                {processing
                  ? 'Processing...'
                  : actionType === 'approve'
                  ? 'Approve'
                  : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
}
