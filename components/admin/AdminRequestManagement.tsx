'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
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
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  FileText,
  ExternalLink,
} from 'lucide-react';
import Footer from '../Footer';

export function AdminRequestManagement() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [adminBarangayId, setAdminBarangayId] = useState<string | null>(null);
  const [requestDocuments, setRequestDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [viewDocumentsDialogOpen, setViewDocumentsDialogOpen] = useState(false);
  const [selectedRequestForDocs, setSelectedRequestForDocs] = useState<
    any | null
  >(null);

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

  const fetchRequestDocuments = async (requestId: string) => {
    setLoadingDocuments(true);
    try {
      console.log('Fetching documents for request:', requestId);
      const response = await fetch(
        `/api/request-documents?requestId=${requestId}`,
      );
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched documents:', data);
        setRequestDocuments(data.documents || []);
      } else {
        console.error('Response not OK:', await response.text());
        setRequestDocuments([]);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setRequestDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleViewDocuments = async (request: any) => {
    setSelectedRequestForDocs(request);
    setRequestDocuments([]);
    setViewDocumentsDialogOpen(true);
    await fetchRequestDocuments(request.id);
  };

  const handleAction = async (request: any, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setRemarks('');
    setRequestDocuments([]);
    setActionDialogOpen(true);
    // Fetch documents for this request
    await fetchRequestDocuments(request.id);
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

  return (
    <div>
      <div className='min-h-screen bg-background'>
        <div className='container mx-auto px-4 py-8'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold mb-2'>Request Management</h1>
            <p className='text-muted-foreground'>
              Manage and review service requests from residents
            </p>
          </div>

          {/* Pending Requests Section */}
          <div className='mb-8'>
            <h2 className='text-2xl font-semibold mb-4'>Pending Requests</h2>
            <AnimatePresence mode='wait'>
              {loading ? (
                <motion.div
                  key='pending-loading'
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className='flex flex-col items-center justify-center py-12'
                >
                  <Image
                    src='/Loading Files.gif'
                    alt='Loading'
                    width={200}
                    height={200}
                    unoptimized
                  />
                </motion.div>
              ) : pendingRequests.length > 0 ? (
                <motion.div
                  key='pending-content'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className='grid gap-4'
                >
                  {pendingRequests.map((request) => (
                    <Card
                      key={request.id}
                      className='hover:shadow-md transition-shadow'
                    >
                      <CardContent className='p-4'>
                        <div className='flex items-center justify-between gap-4'>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-3 mb-2'>
                              <h3 className='font-semibold text-base truncate'>
                                {request.item?.name || 'Unknown Service'}
                              </h3>
                              {getStatusBadge(request.status)}
                            </div>
                            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                              <span className='truncate'>
                                {request.user?.fullName ||
                                  request.user?.email ||
                                  'Unknown User'}
                              </span>
                              <span>•</span>
                              <span>
                                {request.item?.category?.name || 'N/A'}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(
                                  request.submittedAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            {request.reason && (
                              <p className='text-sm text-muted-foreground mt-2 line-clamp-2'>
                                {request.reason}
                              </p>
                            )}
                          </div>
                          <div className='flex gap-2 flex-shrink-0'>
                            <Button
                              onClick={() => handleViewDocuments(request)}
                              size='sm'
                              variant='outline'
                            >
                              <FileText className='w-4 h-4 mr-1' />
                              View Documents
                            </Button>
                            <Button
                              onClick={() => handleAction(request, 'approve')}
                              size='sm'
                              className='bg-green-600 hover:bg-green-700'
                            >
                              <CheckCircle className='w-4 h-4 mr-1' />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleAction(request, 'reject')}
                              size='sm'
                              variant='destructive'
                            >
                              <XCircle className='w-4 h-4 mr-1' />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key='pending-empty'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className='flex flex-col items-center justify-center py-12'
                >
                  <p className='mt-4 text-muted-foreground'>
                    No pending requests
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Other Requests Section */}
          <div>
            <h2 className='text-2xl font-semibold mb-4'>All Requests</h2>
            <AnimatePresence mode='wait'>
              {loading ? (
                <motion.div
                  key='other-loading'
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className='flex flex-col items-center justify-center py-12'
                >
                  <Image
                    src='/Loading Files.gif'
                    alt='Loading'
                    width={200}
                    height={200}
                    unoptimized
                  />
                </motion.div>
              ) : otherRequests.length > 0 ? (
                <motion.div
                  key='other-content'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className='grid gap-4'
                >
                  {otherRequests.map((request) => (
                    <Card
                      key={request.id}
                      className='hover:shadow-md transition-shadow'
                    >
                      <CardContent className='p-4'>
                        <div className='flex items-start justify-between gap-4'>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-3 mb-2'>
                              <h3 className='font-semibold text-base truncate'>
                                {request.item?.name || 'Unknown Service'}
                              </h3>
                              {getStatusBadge(request.status)}
                            </div>
                            <div className='flex items-center gap-4 text-sm text-muted-foreground mb-2'>
                              <span className='truncate'>
                                {request.user?.username ||
                                  request.user?.email ||
                                  'Unknown User'}
                              </span>
                              <span>•</span>
                              <span>
                                {request.item?.category?.name || 'N/A'}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(
                                  request.submittedAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            {request.reason && (
                              <p className='text-sm text-muted-foreground mb-2 line-clamp-2'>
                                {request.reason}
                              </p>
                            )}
                            {request.actions && request.actions.length > 0 && (
                              <div className='text-xs text-muted-foreground mt-2 pt-2 border-t'>
                                {request.actions.map(
                                  (action: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className='inline-block mr-4'
                                    >
                                      <span className='font-medium'>
                                        {action.actionType}
                                      </span>
                                      {action.remarks && (
                                        <span> - {action.remarks}</span>
                                      )}
                                    </span>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key='other-empty'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className='flex flex-col items-center justify-center py-12'
                >
                  <p className='mt-4 text-muted-foreground'>
                    No other requests
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
              {/* Request Details */}
              {selectedRequest && (
                <div className='space-y-2'>
                  <div>
                    <Label className='text-sm font-medium'>Requested by:</Label>
                    <p className='text-sm text-muted-foreground'>
                      {selectedRequest.user?.fullName ||
                        selectedRequest.user?.email ||
                        'Unknown User'}
                    </p>
                  </div>
                  <div>
                    <Label className='text-sm font-medium'>Submitted:</Label>
                    <p className='text-sm text-muted-foreground'>
                      {new Date(selectedRequest.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

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

        {/* View Documents Dialog */}
        <Dialog
          open={viewDocumentsDialogOpen}
          onOpenChange={setViewDocumentsDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Documents</DialogTitle>
              <DialogDescription>
                {selectedRequestForDocs && (
                  <>
                    Documents for "
                    {selectedRequestForDocs.item?.name || 'Unknown Service'}"
                    request
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              {/* Request Info */}
              {selectedRequestForDocs && (
                <div className='space-y-2 pb-3 border-b'>
                  <div>
                    <Label className='text-sm font-medium'>Requested by:</Label>
                    <p className='text-sm text-muted-foreground'>
                      {selectedRequestForDocs.user?.fullName ||
                        selectedRequestForDocs.user?.email ||
                        'Unknown User'}
                    </p>
                  </div>
                  <div>
                    <Label className='text-sm font-medium'>Submitted:</Label>
                    <p className='text-sm text-muted-foreground'>
                      {new Date(
                        selectedRequestForDocs.submittedAt,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Documents List */}
              <div>
                <Label className='text-sm font-medium mb-2 block'>
                  Submitted Documents
                </Label>
                {loadingDocuments ? (
                  <div className='text-sm text-muted-foreground'>
                    Loading documents...
                  </div>
                ) : requestDocuments.length > 0 ? (
                  <div className='space-y-2'>
                    {requestDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className='flex items-center justify-between p-3 border rounded-md hover:bg-gray-50'
                      >
                        <div className='flex items-center space-x-2'>
                          <FileText className='h-5 w-5 text-blue-600' />
                          <div>
                            <p className='text-sm font-medium'>
                              {doc.documentName}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              Uploaded{' '}
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => window.open(doc.documentUrl, '_blank')}
                        >
                          <ExternalLink className='h-4 w-4 mr-1' />
                          Open
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-sm text-muted-foreground py-4 text-center border rounded-md'>
                    No documents submitted for this request
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setViewDocumentsDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
}
