'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SharedHeader } from '../../SharedHeader';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Calendar } from '../../ui/calendar';
import { ScrollArea } from '../../ui/scroll-area';
import { FileCheck2, AlertTriangle, CalendarClock } from 'lucide-react'

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
import Footer from '../../Footer';
import { useItems, useCategories } from '@/lib/hooks/useItems';
import { useAuth } from '@/lib/hooks/useAuth';
import { createRequest } from '@/lib/api/requests';
import { toast } from 'sonner';

// Dynamic imports for Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false },
);
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false,
});

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
  // Remove reason, add Letter of Intent image upload
  const [letterOfIntent, setLetterOfIntent] = useState<File | null>(null);
  const [letterOfIntentUrl, setLetterOfIntentUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<
    Record<string, { time: string; userId: string; userName: string }[]>
  >({});
  const [loadingSlots, setLoadingSlots] = useState(false);

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

  // Parse facility type to get max advance booking days
  const getMaxAdvanceDays = (type: string | null | undefined) => {
    if (!type) return 30; // default 30 days if no type
    const match = type.match(/(\d+)\s*(day|week)s?/i);
    if (!match) return 30;
    const num = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 'day') return num;
    if (unit === 'week') return num * 7;
    return 30;
  };

  // Fix for Leaflet default icon in Next.js - only run on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl:
            'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl:
            'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      });
    }
  }, []);

  // Fetch reservations when date or facility changes
  useEffect(() => {
    const fetchReservations = async () => {
      if (!selectedDate || !selectedFacilityForRequest) return;

      setLoadingSlots(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const response = await fetch(
          `/api/reservations?itemId=${selectedFacilityForRequest.id}&date=${dateStr}`,
        );

        if (response.ok) {
          const data = await response.json();
          const dateKey = `${selectedFacilityForRequest.id}-${dateStr}`;
          const slots = data.reservations.flatMap((reservation: any) =>
            reservation.timeSlots.map((time: string) => ({
              time,
              userId: reservation.user.id,
              userName: reservation.user.fullName || reservation.user.email,
            })),
          );
          setBookedSlots({ ...bookedSlots, [dateKey]: slots });
        }
      } catch (error) {
        console.error('Failed to fetch reservations:', error);
      } finally {
        setLoadingSlots(false);
      }
    };

    if (requestModalOpen) {
      fetchReservations();
    }
  }, [selectedDate, selectedFacilityForRequest, requestModalOpen]);

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
    // Select the first available date based on advance booking rules
    const maxAdvanceDays = getMaxAdvanceDays(facility.type);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + maxAdvanceDays);
    setSelectedDate(minDate);
    setSelectedTimes([]);
    setRequestModalOpen(true);
  };

  const handleTimeToggle = (time: string) => {
    setSelectedTimes((prev) =>
      prev.includes(time)
        ? prev.filter((t) => t !== time)
        : [...prev, time].sort((a, b) => {
            // Sort times chronologically
            const parseTime = (t: string) => {
              const [timePart, period] = t.split(' ');
              let [hours, minutes] = timePart.split(':').map(Number);
              if (period === 'PM' && hours !== 12) hours += 12;
              if (period === 'AM' && hours === 12) hours = 0;
              return hours * 60 + minutes;
            };
            return parseTime(a) - parseTime(b);
          }),
    );
  };

  const handleSubmitRequest = async () => {
    if (
      !user ||
      !selectedFacilityForRequest ||
      !selectedDate ||
      selectedTimes.length === 0
    ) {
      toast.error('Please select at least one time slot');
      return;
    }
    if (!letterOfIntent) {
      toast.error('Please upload a Letter of Intent image.');
      return;
    }

    // Check if selected times are consecutive
    const sortedTimes = selectedTimes.sort((a, b) => {
      const parseTime = (t: string) => {
        const [timePart, period] = t.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      return parseTime(a) - parseTime(b);
    });
    const isConsecutive = sortedTimes.every((time, index) => {
      if (index === 0) return true;
      const prevTime = sortedTimes[index - 1];
      const parseTime = (t: string) => {
        const [timePart, period] = t.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      return parseTime(time) - parseTime(prevTime) === 30;
    });
    if (!isConsecutive) {
      toast.error('Please select consecutive time slots (e.g., 7:00 AM to 8:30 AM).');
      return;
    }

    setSubmitting(true);
    setUploading(true);
    try {
      // Upload Letter of Intent image
      const formData = new FormData();
      formData.append('file', letterOfIntent);
      formData.append('type', 'letter_of_intent');
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        toast.error(uploadData.error || 'Failed to upload Letter of Intent');
        setUploading(false);
        setSubmitting(false);
        return;
      }
      setLetterOfIntentUrl(uploadData.url);
      setUploading(false);

      // Submit reservation with document URL
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          itemId: selectedFacilityForRequest.id,
          reservationDate: selectedDate.toISOString().split('T')[0],
          timeSlots: selectedTimes,
          letterOfIntentUrl: uploadData.url,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          toast.error(data.error || 'Some time slots are already booked');
        } else {
          toast.error(data.error || 'Failed to create reservation');
        }
        return;
      }
      toast.success(
        `Reservation submitted! Wait for admin approval of ${selectedTimes.length} time slot${
          selectedTimes.length > 1 ? 's' : ''
        }.`,
      );
      setRequestModalOpen(false);
      setLetterOfIntent(null);
      setLetterOfIntentUrl('');
      setSelectedTimes([]);
    } catch (error) {
      console.error('Failed to submit reservation:', error);
      toast.error('Failed to submit reservation');
    } finally {
      setSubmitting(false);
      setUploading(false);
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
          {/* TOP */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-12 items-center p-8 md:p-12">
            {/* Left Side - Title + Description */}
            <div>
              <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                Facilities - Booking Rules
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Please read and understand the rules before reserving any barangay
                facility.
              </p>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-full w-px bg-[repeating-linear-gradient(180deg,transparent,transparent_4px,currentColor_4px,currentColor_10px)] [mask-image:linear-gradient(180deg,transparent,black_25%,black_75%,transparent)]" />

            {/* Right Side - Rules */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <FileCheck2 className="font-semibold text-blue-800" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Final Reservation
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Once you click <strong>“Book Reservation”</strong> and submit, the
                    reservation <strong>cannot be canceled</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <AlertTriangle className="font-semibold text-blue-800" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    No Show Policy
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Failure to show up on your scheduled reservation will result in
                    <strong> account suspension</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CalendarClock className="font-semibold text-blue-800" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Advance Booking & Payment
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Reservations must be made at least <strong>1-3 days in advance</strong>.
                    Payment must be done <strong>in person</strong> at the barangay office.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FACILITIES - Search Box */}
          <div>
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
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const maxAdvanceDays = getMaxAdvanceDays(selectedFacilityForRequest?.type);
                const minDate = new Date(today);
                minDate.setDate(today.getDate() + maxAdvanceDays);
                return (
                  <Calendar
                    mode='single'
                    onSelect={setSelectedDate}
                    selected={selectedDate}
                    disabled={(date) =>
                      date < minDate
                    }
                  />
                );
              })()}
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
                    {selectedTimes.length > 0 && (
                      <p className='text-center text-xs font-medium text-blue-600'>
                        {selectedTimes.length} slot
                        {selectedTimes.length > 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                  <ScrollArea className='h-[300px] overflow-y-auto'>
                    {loadingSlots ? (
                      <div className='flex items-center justify-center py-8'>
                        <p className='text-sm text-muted-foreground'>
                          Loading slots...
                        </p>
                      </div>
                    ) : (
                      <div className='grid grid-cols-2 gap-2 px-4 pb-4'>
                        {availableTimes.map((time) => {
                          const dateKey =
                            selectedDate?.toISOString().split('T')[0] || '';
                          const facilityKey = `${selectedFacilityForRequest?.id}-${dateKey}`;
                          const existingBookings =
                            bookedSlots[facilityKey] || [];
                          const booking = existingBookings.find(
                            (b) => b.time === time,
                          );
                          const isBooked = !!booking;
                          const isSelected = selectedTimes.includes(time);

                          return (
                            <Button
                              key={time}
                              onClick={() =>
                                !isBooked && handleTimeToggle(time)
                              }
                              size='sm'
                              variant={isSelected ? 'default' : 'outline'}
                              disabled={isBooked}
                              className={
                                isSelected
                                  ? 'bg-blue-600 hover:bg-blue-700'
                                  : ''
                              }
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
                                isBooked
                                  ? `Booked by ${booking.userName}`
                                  : time
                              }
                            >
                              {time}
                              {isSelected && ' ✓'}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </div>


            {/* Letter of Intent Upload */}
            <div className='mb-4'>
              <Label htmlFor='letterOfIntent'>Letter of Intent (Image, required)</Label>
              <Input
                id='letterOfIntent'
                type='file'
                accept='image/png, image/jpeg, image/jpg'
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setLetterOfIntent(e.target.files[0]);
                  }
                }}
                disabled={submitting || uploading}
              />
              {letterOfIntent && (
                <div className='mt-2'>
                  <span className='text-xs text-muted-foreground'>
                    Selected: {letterOfIntent.name}
                  </span>
                </div>
              )}
            </div>

            {/* Selected Info */}
            {selectedDate && selectedTimes.length > 0 && (
              <div className='p-3 bg-blue-50 rounded-md'>
                <p className='text-sm font-medium text-blue-900 mb-1'>
                  Selected: {selectedDate.toLocaleDateString()}
                </p>
                <p className='text-xs text-blue-700'>
                  Time slots: {selectedTimes.join(', ')}
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
              disabled={
                submitting || uploading || !selectedDate || selectedTimes.length === 0 || !letterOfIntent
              }
              className='bg-blue-600 hover:bg-blue-700'
            >
              {submitting || uploading
                ? 'Submitting...'
                : `Book ${
                    selectedTimes.length > 0
                      ? `(${selectedTimes.length} slot${
                          selectedTimes.length > 1 ? 's' : ''
                        })`
                      : 'Reservation'
                  }`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
