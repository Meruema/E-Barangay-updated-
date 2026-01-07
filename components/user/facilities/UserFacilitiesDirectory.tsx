'use client';

import { useState, useMemo, useEffect } from 'react';
import { SharedHeader } from '../../SharedHeader';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Calendar } from '../../ui/calendar';
import { ScrollArea } from '../../ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '../../ui/dialog';
import { Search, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import * as L from 'leaflet';
import Footer from '../../Footer';
import { useItems, useCategories } from '@/lib/hooks/useItems';
import { useAuth } from '@/lib/hooks/useAuth';
import { createRequest } from '@/lib/api/requests';
import { toast } from 'sonner';

interface FacilityDirectoryProps {
  onNavigate: (
    view: 'dashboard' | 'services' | 'facilities' | 'application' | 'requests',
  ) => void;
  onSelectFacility: (facility: string) => void;
  facilities?: any[];
  categories?: any[];
}

// Fix for Leaflet default icon in Next.js - moved to useEffect to avoid SSR issues

// Default coordinates for Bacoor, Cavite
const defaultLat = 14.41;
const defaultLng = 120.97;

export function FacilitiesDirectory({
  onSelectFacility,
  facilities: propFacilities,
  categories: propCategories,
}: FacilityDirectoryProps) {
  const { user } = useAuth();
  const barangayId = user?.barangayId ?? undefined;
  const { items: fetchedFacilities, loading: facilitiesLoading } = useItems(
    'facility',
    barangayId,
  );
  const { categories: fetchedCategories, loading: categoriesLoading } =
    useCategories();

  // Use prop data if available, otherwise use fetched data
  const facilities = propFacilities ?? fetchedFacilities;
  const categories = propCategories ?? fetchedCategories;
  const loading = propFacilities
    ? false
    : facilitiesLoading || categoriesLoading;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedFacilityForRequest, setSelectedFacilityForRequest] =
    useState<any>(null);
  const [requestReason, setRequestReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<
    Record<string, { time: string; userId: string; userName: string }[]>
  >({});

  const availableTimes = [
    '07:00 AM',
    '07:30 AM',
    '08:00 AM',
    '08:30 AM',
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '01:00 PM',
    '01:30 PM',
    '02:00 PM',
    '02:30 PM',
    '03:00 PM',
    '03:30 PM',
    '04:00 PM',
    '04:30 PM',
    '05:00 PM',
    '05:30 PM',
  ];

  // Generate consistent color for user
  const getUserColor = (userId: string) => {
    const colors = [
      'rgba(239, 68, 68, 0.4)', // red
      'rgba(249, 115, 22, 0.4)', // orange
      'rgba(234, 179, 8, 0.4)', // yellow
      'rgba(34, 197, 94, 0.4)', // green
      'rgba(59, 130, 246, 0.4)', // blue
      'rgba(168, 85, 247, 0.4)', // purple
      'rgba(236, 72, 153, 0.4)', // pink
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Fix for Leaflet default icon in Next.js - only run on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    }
  }, []);

  const categoryOptions = useMemo(() => {
    const allOption = {
      id: 'all',
      label: 'All Facilities',
      count: facilities.length,
    };
    const categoryOptions = categories.map((cat) => ({
      id: cat.id,
      label: cat.name,
      count: facilities.filter((f) => {
        const categoryId = (f as any).categoryId || (f as any).category_id;
        return categoryId === cat.id;
      }).length,
    }));
    return [allOption, ...categoryOptions];
  }, [categories, facilities]);

  const filteredServices = useMemo(() => {
    return facilities.filter((facility) => {
      const matchesSearch =
        facility.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        false;
      const categoryId =
        (facility as any).categoryId || (facility as any).category_id;
      const matchesCategory =
        selectedCategory === 'all' || categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [facilities, searchTerm, selectedCategory]);

  const handleFacilityClick = (facility: any) => {
    setSelectedFacilityForRequest(facility);
    setRequestReason('');
    setSelectedDate(new Date());
    setSelectedTime(null);
    setRequestModalOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (
      !user ||
      !selectedFacilityForRequest ||
      !selectedDate ||
      !selectedTime
    ) {
      toast.error('Please select both date and time');
      return;
    }

    // Check for time conflicts
    const dateKey = selectedDate.toISOString().split('T')[0];
    const facilityKey = `${selectedFacilityForRequest.id}-${dateKey}`;
    const existingBookings = bookedSlots[facilityKey] || [];

    if (existingBookings.some((b) => b.time === selectedTime)) {
      toast.error('This time slot is already booked');
      return;
    }

    setSubmitting(true);
    try {
      const requestData = {
        userId: user.id,
        itemId: selectedFacilityForRequest.id,
        reason: requestReason,
        scheduledDate: selectedDate.toISOString(),
        scheduledTime: selectedTime,
      };

      await createRequest(
        user.id,
        selectedFacilityForRequest.id,
        `${requestReason}\nScheduled: ${selectedDate.toLocaleDateString()} at ${selectedTime}`,
      );

      toast.success('Request submitted successfully!');
      setRequestModalOpen(false);
      setRequestReason('');
      setSelectedTime(null);
    } catch (error) {
      console.error('Failed to submit request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>Loading facilities...</div>
      </div>
    );
  }

  return (
    <div>
      <div className='min-h-screen bg-gradient-to-b from-blue-50 to-gray-200 p-6 rounded-lg m-5'>
        <SharedHeader />

        <main className='max-w-7xl mx-auto px-4 py-8'>
          {/* MAP VIEW */}
          <h2 className='text-2xl mb-4 flex items-center font-semibold justify-center'>
            {' '}
            Barangay Facilities
          </h2>

          {/* FACILITIES - Search Box */}
          <div>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-semibold'>
                All Facilities ({filteredServices.length})
              </h2>
            </div>
            {/* Search + Category */}
            <div className='flex items-center gap-4 mb-6'>
              {/* Search */}
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4' />
                  <Input
                    type='text'
                    placeholder='Search facilities...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10 w-full bg-white'
                  />
                </div>
              </div>

              {/* Category */}
              <div className='w-150'>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className='bg-white'>
                    <SelectValue placeholder='Category' />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.label} ({category.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* FACILITIES - Card */}
          <div className='space-y-4 grid md:grid-cols-3 gap-4'>
            {filteredServices.map((facility) => {
              return (
                <div key={facility.id} className='w-full max-w-4xl'>
                  <Card
                    className='rounded-lg hover:shadow-lg transition-shadow cursor-pointer max-h-120px flex flex-col'
                    onClick={() => handleFacilityClick(facility)}
                  >
                    <CardHeader className='pb-3'>
                      <div className='flex items-start gap-4'>
                        {/* Image on the left */}
                        {(facility as any).imageUrl ||
                        (facility as any).image_url ? (
                          <img
                            src={
                              (facility as any).imageUrl ||
                              (facility as any).image_url
                            }
                            alt={facility.name || 'Facility'}
                            className='w-48 h-36 object-cover rounded-lg border border-blue-800'
                          />
                        ) : (
                          <div className='w-48 h-36 bg-gray-200 rounded-lg border border-blue-800 flex items-center justify-center'>
                            <span className='text-gray-400'>No image</span>
                          </div>
                        )}

                        {/* Text content beside the image */}
                        <div className='flex flex-col justify-center text-left'>
                          <CardTitle className='text-lg font-bold mb-1'>
                            {facility.name}
                          </CardTitle>
                          <CardDescription className='text-sm text-gray-600'>
                            {facility.description || 'No description available'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className='pt-2'>
                      <Button
                        variant='outline'
                        className='w-full'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFacilityClick(facility);
                        }}
                      >
                        Book Appointment
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {filteredServices.length === 0 && (
            <div className='text-center py-12'>
              <div className='text-gray-400 text-lg mb-2'>
                No services found
              </div>
              <p className='text-gray-600'>
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </main>
      </div>
      <div>
        {' '}
        <Footer />{' '}
      </div>

      {/* Request Modal */}
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent className='sm:max-w-[900px]'>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              {selectedFacilityForRequest && (
                <>Book "{selectedFacilityForRequest.name}"</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Calendar and Time Picker */}
            <div className='flex divide-x overflow-hidden rounded-md border bg-background'>
              <Calendar
                mode='single'
                onSelect={setSelectedDate}
                selected={selectedDate}
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
              />
              <div className='relative w-[300px] overflow-hidden'>
                <div className='absolute inset-0 grid gap-4'>
                  <div className='space-y-2 px-4 pt-4'>
                    <p className='text-center text-sm font-medium'>
                      Available Times
                    </p>
                    {selectedDate && (
                      <p className='text-center text-xs text-muted-foreground'>
                        {selectedDate.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <ScrollArea className='h-[300px] overflow-y-auto'>
                    <div className='grid grid-cols-2 gap-2 px-4 pb-4'>
                      {availableTimes.map((time) => {
                        const dateKey =
                          selectedDate?.toISOString().split('T')[0] || '';
                        const facilityKey = `${selectedFacilityForRequest?.id}-${dateKey}`;
                        const existingBookings = bookedSlots[facilityKey] || [];
                        const booking = existingBookings.find(
                          (b) => b.time === time,
                        );
                        const isBooked = !!booking;

                        return (
                          <Button
                            key={time}
                            onClick={() => !isBooked && setSelectedTime(time)}
                            size='sm'
                            variant={
                              selectedTime === time ? 'default' : 'outline'
                            }
                            disabled={isBooked}
                            style={
                              isBooked
                                ? {
                                    backgroundColor: getUserColor(
                                      booking.userId,
                                    ),
                                    borderColor: getUserColor(booking.userId),
                                  }
                                : {}
                            }
                            title={
                              isBooked ? `Booked by ${booking.userName}` : time
                            }
                          >
                            {time}
                          </Button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <Label htmlFor='reason'>Reason for Request (Optional)</Label>
              <Textarea
                id='reason'
                placeholder='Please provide details about your request...'
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* Selected Info */}
            {selectedDate && selectedTime && (
              <div className='p-3 bg-blue-50 rounded-md'>
                <p className='text-sm font-medium text-blue-900'>
                  Selected: {selectedDate.toLocaleDateString()} at{' '}
                  {selectedTime}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setRequestModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={submitting || !selectedDate || !selectedTime}
              className='bg-blue-600 hover:bg-blue-700'
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
