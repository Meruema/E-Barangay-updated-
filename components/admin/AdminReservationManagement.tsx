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
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCurrentUser } from '@/app/actions/auth';
import { toast } from 'sonner';
import { Clock, CheckCircle, XCircle, Calendar, Users } from 'lucide-react';
import Footer from '@/components/Footer';

export function AdminReservationManagement() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<any | null>(
    null,
  );
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'confirm' | 'cancel'>('confirm');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [adminBarangayId, setAdminBarangayId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictingReservations, setConflictingReservations] = useState<any[]>(
    [],
  );

  useEffect(() => {
    loadReservations();
  }, [statusFilter]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
        if (user.role === 'ADMIN' && user.barangay && user.barangay.id) {
          setAdminBarangayId(user.barangay.id);
        }
      }

      const params = new URLSearchParams();
      if (user?.role === 'ADMIN' && user.barangay?.id) {
        params.append('barangayId', user.barangay.id);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(
        `/api/reservations/admin?${params.toString()}`,
      );
      if (response.ok) {
        const data = await response.json();
        setReservations(data.reservations || []);
      } else {
        toast.error('Failed to load reservations');
      }
    } catch (error) {
      console.error('Failed to load reservations:', error);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (reservation: any, type: 'confirm' | 'cancel') => {
    setSelectedReservation(reservation);
    setActionType(type);
    setRejectionReason('');
    setActionDialogOpen(true);
  };

  const submitAction = async (
    autoReject: boolean | React.MouseEvent = false,
  ) => {
    // Handle case where event object is passed instead of boolean
    const shouldAutoReject =
      typeof autoReject === 'boolean' ? autoReject : false;

    if (!selectedReservation || !currentUserId) return;

    if (actionType === 'cancel' && !rejectionReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: selectedReservation.id,
          status: actionType === 'confirm' ? 'confirmed' : 'cancelled',
          approvedBy: actionType === 'confirm' ? currentUserId : undefined,
          rejectionReason:
            actionType === 'cancel' ? rejectionReason : undefined,
          autoRejectConflicts: shouldAutoReject,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Check if there are conflicting reservations
        if (data.requiresConfirmation && data.conflictingReservations) {
          setConflictingReservations(data.conflictingReservations);
          setConflictDialogOpen(true);
          setProcessing(false);
          return;
        }

        const rejectedCount = data.rejectedCount || 0;
        toast.success(
          `Reservation ${
            actionType === 'confirm' ? 'confirmed' : 'cancelled'
          } successfully${
            rejectedCount > 0
              ? `. ${rejectedCount} conflicting reservation${
                  rejectedCount > 1 ? 's' : ''
                } automatically rejected.`
              : ''
          }`,
        );
        setActionDialogOpen(false);
        setConflictDialogOpen(false);
        loadReservations();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update reservation');
      }
    } catch (error) {
      console.error('Failed to update reservation:', error);
      toast.error('Failed to update reservation');
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
            Pending
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge
            variant='outline'
            className='bg-green-50 text-green-700 border-green-200'
          >
            Confirmed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge
            variant='outline'
            className='bg-red-50 text-red-700 border-red-200'
          >
            Cancelled
          </Badge>
        );
      case 'completed':
        return (
          <Badge
            variant='outline'
            className='bg-blue-50 text-blue-700 border-blue-200'
          >
            Completed
          </Badge>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  const pendingReservations = reservations.filter(
    (r) => r.status === 'pending',
  );
  const otherReservations = reservations.filter((r) => r.status !== 'pending');

  return (
    <div>
      <div className='min-h-screen bg-background'>
        <div className='container mx-auto px-4 py-8'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold mb-2'>Reservation Management</h1>
            <p className='text-muted-foreground'>
              Manage and review facility reservations from residents
            </p>
          </div>

          {/* Status Filter */}
          <div className='mb-6 flex gap-4 items-center'>
            <Label>Filter by status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-48'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Reservations</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='confirmed'>Confirmed</SelectItem>
                <SelectItem value='cancelled'>Cancelled</SelectItem>
                <SelectItem value='completed'>Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pending Reservations Section */}
          {statusFilter === 'pending' || statusFilter === 'all' ? (
            <div className='mb-8'>
              <h2 className='text-2xl font-semibold mb-4'>
                Pending Reservations ({pendingReservations.length})
              </h2>
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
                ) : pendingReservations.length > 0 ? (
                  <motion.div
                    key='pending-content'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className='grid gap-4'
                  >
                    {pendingReservations.map((reservation) => (
                      <Card
                        key={reservation.id}
                        className='hover:shadow-md transition-shadow'
                      >
                        <CardContent className='p-4'>
                          <div className='flex items-center justify-between gap-4'>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-3 mb-2'>
                                <h3 className='font-semibold text-base truncate'>
                                  {reservation.item?.name || 'Unknown Facility'}
                                </h3>
                                {getStatusBadge(reservation.status)}
                              </div>
                              <div className='flex items-center gap-4 text-sm text-muted-foreground mb-2'>
                                <span className='flex items-center gap-1'>
                                  <Users className='h-4 w-4' />
                                  {reservation.user?.fullName ||
                                    reservation.user?.email}
                                </span>
                                <span>•</span>
                                <span className='flex items-center gap-1'>
                                  <Calendar className='h-4 w-4' />
                                  {new Date(
                                    reservation.reservationDate,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className='flex flex-wrap gap-1 mt-2'>
                                {reservation.timeSlots.map((slot: string) => (
                                  <Badge
                                    key={slot}
                                    variant='secondary'
                                    className='text-xs'
                                  >
                                    {slot}
                                  </Badge>
                                ))}
                              </div>
                              {/* See Document Button for Letter of Intent */}
                              {reservation.letterOfIntentUrl && (
                                <Button
                                  size='sm'
                                  variant='secondary'
                                  className='mt-2'
                                  onClick={() => window.open(reservation.letterOfIntentUrl, '_blank')}
                                >
                                  See Document
                                </Button>
                              )}
                            </div>
                            <div className='flex gap-2 flex-shrink-0'>
                              <Button
                                onClick={() =>
                                  handleAction(reservation, 'confirm')
                                }
                                size='sm'
                                className='bg-green-600 hover:bg-green-700'
                              >
                                <CheckCircle className='w-4 h-4 mr-1' />
                                Confirm
                              </Button>
                              <Button
                                onClick={() =>
                                  handleAction(reservation, 'cancel')
                                }
                                size='sm'
                                variant='destructive'
                              >
                                <XCircle className='w-4 h-4 mr-1' />
                                Cancel
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
                      No pending reservations
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : null}

          {/* Other Reservations Section */}
          {statusFilter !== 'pending' && (
            <div className='mb-8'>
              <h2 className='text-2xl font-semibold mb-4'>
                {statusFilter === 'all'
                  ? 'Other Reservations'
                  : `${
                      statusFilter.charAt(0).toUpperCase() +
                      statusFilter.slice(1)
                    } Reservations`}{' '}
                (
                {statusFilter === 'all'
                  ? otherReservations.length
                  : reservations.length}
                )
              </h2>
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
                ) : (statusFilter === 'all' ? otherReservations : reservations)
                    .length > 0 ? (
                  <motion.div
                    key='other-content'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className='grid gap-4'
                  >
                    {(statusFilter === 'all'
                      ? otherReservations
                      : reservations
                    ).map((reservation) => (
                      <Card
                        key={reservation.id}
                        className='hover:shadow-md transition-shadow'
                      >
                        <CardContent className='p-4'>
                          <div className='flex items-center justify-between gap-4'>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-3 mb-2'>
                                <h3 className='font-semibold text-base truncate'>
                                  {reservation.item?.name || 'Unknown Facility'}
                                </h3>
                                {getStatusBadge(reservation.status)}
                              </div>
                              <div className='flex items-center gap-4 text-sm text-muted-foreground mb-2'>
                                <span className='flex items-center gap-1'>
                                  <Users className='h-4 w-4' />
                                  {reservation.user?.fullName ||
                                    reservation.user?.email}
                                </span>
                                <span>•</span>
                                <span className='flex items-center gap-1'>
                                  <Calendar className='h-4 w-4' />
                                  {new Date(
                                    reservation.reservationDate,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className='flex flex-wrap gap-1 mt-2'>
                                {reservation.timeSlots.map((slot: string) => (
                                  <Badge
                                    key={slot}
                                    variant='secondary'
                                    className='text-xs'
                                  >
                                    {slot}
                                  </Badge>
                                ))}
                              </div>
                              {reservation.rejectionReason && (
                                <p className='text-sm text-red-600 mt-2'>
                                  Cancellation reason:{' '}
                                  {reservation.rejectionReason}
                                </p>
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
                      No reservations found
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'confirm'
                  ? 'Confirm Reservation'
                  : 'Cancel Reservation'}
              </DialogTitle>
              <DialogDescription>
                {selectedReservation && (
                  <>
                    {actionType === 'confirm'
                      ? `Confirm reservation for "${selectedReservation.item?.name}"?`
                      : `Cancel reservation for "${selectedReservation.item?.name}"?`}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              {selectedReservation && (
                <div className='space-y-2'>
                  <div>
                    <Label className='text-sm font-medium'>Requested by:</Label>
                    <p className='text-sm text-muted-foreground'>
                      {selectedReservation.user?.fullName ||
                        selectedReservation.user?.email}
                    </p>
                  </div>
                  <div>
                    <Label className='text-sm font-medium'>Date:</Label>
                    <p className='text-sm text-muted-foreground'>
                      {new Date(
                        selectedReservation.reservationDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className='text-sm font-medium'>Time Slots:</Label>
                    <div className='flex flex-wrap gap-1 mt-1'>
                      {selectedReservation.timeSlots.map((slot: string) => (
                        <Badge
                          key={slot}
                          variant='secondary'
                          className='text-xs'
                        >
                          {slot}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {selectedReservation.reason && (
                    <div>
                      <Label className='text-sm font-medium'>Reason:</Label>
                      <p className='text-sm text-muted-foreground'>
                        {selectedReservation.reason}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {actionType === 'cancel' && (
                <div>
                  <Label htmlFor='rejection'>Cancellation Reason *</Label>
                  <Textarea
                    id='rejection'
                    placeholder='Provide a reason for cancellation...'
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
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
                  actionType === 'confirm'
                    ? 'bg-green-600 hover:bg-green-700'
                    : ''
                }
                variant={actionType === 'cancel' ? 'destructive' : 'default'}
              >
                {processing
                  ? 'Processing...'
                  : actionType === 'confirm'
                  ? 'Confirm'
                  : 'Cancel Reservation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Conflict Warning Dialog */}
        <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className='text-yellow-600'>
                ⚠️ Conflicting Reservations Detected
              </DialogTitle>
              <DialogDescription>
                If you approve this reservation, the following conflicting
                reservations will be automatically rejected due to overlapping
                time slots:
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-3 max-h-96 overflow-y-auto'>
              {conflictingReservations.map((conflict, index) => (
                <Card
                  key={conflict.id}
                  className='border-yellow-200 bg-yellow-50'
                >
                  <CardContent className='p-3'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium text-sm'>
                          {conflict.userName}
                        </p>
                        <div className='flex flex-wrap gap-1 mt-1'>
                          {conflict.timeSlots.map((slot: string) => (
                            <Badge
                              key={slot}
                              variant='destructive'
                              className='text-xs'
                            >
                              {slot}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <XCircle className='h-5 w-5 text-red-500' />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setConflictDialogOpen(false);
                  setActionDialogOpen(true);
                }}
                disabled={processing}
              >
                Go Back
              </Button>
              <Button
                onClick={() => submitAction(true)}
                disabled={processing}
                className='bg-orange-600 hover:bg-orange-700'
              >
                {processing
                  ? 'Processing...'
                  : `Confirm & Auto-Reject ${
                      conflictingReservations.length
                    } Conflict${conflictingReservations.length > 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
}
