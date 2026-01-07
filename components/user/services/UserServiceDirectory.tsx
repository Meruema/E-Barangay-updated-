'use client';

import { useState, useMemo } from 'react';
import { SharedHeader } from '../../SharedHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { useItems, useCategories } from '@/lib/hooks/useItems';
import { useAuth } from '@/lib/hooks/useAuth';
import { createRequest } from '@/lib/api/requests';
import { toast } from 'sonner';
import {
  FileCheck,
  Building,
  Hammer,
  Home,
  Users,
  HeartPulseIcon,
  Car,
  Hospital,
  Accessibility,
  User,
  Shield,
  Lock,
} from 'lucide-react';

import { Search, Clock, FileText, Star, Calendar } from 'lucide-react';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../../ui/carousel';

import Footer from '../../Footer';

interface ServiceDirectoryProps {
  onNavigate: (
    view: 'dashboard' | 'services' | 'facilities' | 'application' | 'requests',
  ) => void;
  onSelectService: (service: string) => void;
  services?: any[];
  categories?: any[];
}

const iconMap: Record<string, any> = {
  default: FileCheck,
  clearance: FileCheck,
  permit: Building,
  construction: Hammer,
  residency: Home,
  indigency: Users,
  health: HeartPulseIcon,
  tricycle: Car,
  referral: Hospital,
  senior: Accessibility,
  solo: User,
  blotter: Shield,
  protection: Lock,
};

export function ServiceDirectory({
  onNavigate,
  onSelectService,
  services: propServices,
  categories: propCategories,
}: ServiceDirectoryProps) {
  const { user } = useAuth();
  const barangayId = user?.barangayId ?? undefined;
  const { items: fetchedServices, loading: servicesLoading } = useItems(
    'service',
    barangayId,
  );
  const { categories: fetchedCategories, loading: categoriesLoading } =
    useCategories();

  // Use prop data if available, otherwise use fetched data
  const services = propServices ?? fetchedServices;
  const categories = propCategories ?? fetchedCategories;
  const loading = propServices ? false : servicesLoading || categoriesLoading;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('alphabetical');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedServiceForRequest, setSelectedServiceForRequest] =
    useState<any>(null);
  const [requestReason, setRequestReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = useMemo(() => {
    const allOption = {
      id: 'all',
      label: 'All Services',
      count: services.length,
    };
    const categoryOptions = categories.map((cat) => ({
      id: cat.id,
      label: cat.name,
      count: services.filter((s) => {
        const categoryId = (s as any).categoryId || (s as any).category_id;
        return categoryId === cat.id;
      }).length,
    }));
    return [allOption, ...categoryOptions];
  }, [categories, services]);

  const filteredServices = useMemo(() => {
    let filtered = services.filter((service) => {
      const matchesSearch =
        service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false;
      const categoryId =
        (service as any).categoryId || (service as any).category_id;
      const matchesCategory =
        selectedCategory === 'all' || categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return (a.name || '').localeCompare(b.name || '');
        case 'category':
          return (a.category?.name || '').localeCompare(b.category?.name || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [services, searchTerm, selectedCategory, sortBy]);

  const featuredServices = filteredServices.slice(0, 6); // Show first 6 as featured

  const handleServiceClick = (service: any) => {
    setSelectedServiceForRequest(service);
    setRequestReason('');
    setRequestModalOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!user || !selectedServiceForRequest) return;

    setSubmitting(true);
    try {
      await createRequest(user.id, selectedServiceForRequest.id, requestReason);
      toast.success('Request submitted successfully!');
      setRequestModalOpen(false);
      setRequestReason('');
    } catch (error) {
      console.error('Failed to submit request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className='min-h-screen bg-gradient-to-b from-blue-50 to-gray-200 p-6 rounded-lg m-5'>
        <SharedHeader />

        <main className='max-w-7xl mx-auto px-4 py-8'>
          {/* SERVICES - Feautured */}

          <div>
            {/* SERVICES - Search Box */}
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-semibold'>
                All Services ({filteredServices.length})
              </h2>
            </div>
            {/* Search + Category + Sort Side by Side */}
            <div className='flex items-center gap-4 mb-6'>
              {/* Search */}
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4' />
                  <Input
                    type='text'
                    placeholder='Search services...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10 w-full bg-white'
                  />
                </div>
              </div>

              {/* Category */}
              <div className='w-48'>
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

              {/* Sort By */}
              <div className='w-48'>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className='bg-white'>
                    <SelectValue placeholder='Sort By' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='alphabetical'>A-Z</SelectItem>
                    <SelectItem value='category'>Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SERVICES - Card */}
            <div className='space-y-4'>
              {filteredServices.map((service) => {
                const iconName =
                  service.name?.toLowerCase().split(' ')[0] || 'default';
                const IconComponent = iconMap[iconName] || iconMap.default;
                return (
                  <Card
                    key={service.id}
                    className='hover:shadow-md transition-shadow cursor-pointer border-r-5 border-r-blue-700'
                    onClick={() => handleServiceClick(service)}
                  >
                    <CardContent className='p-6'>
                      <div className='flex items-start justify-between'>
                        {/* Left: Icon, Title, Description, Badges + Processing */}
                        <div className='flex space-x-5 flex-1'>
                          {/* Service Icon */}
                          <div className='p-2 rounded-lg flex items-center justify-center'>
                            <IconComponent className='h-10 w-10 text-blue-800' />
                          </div>

                          {/* Title + Info */}
                          <div className='flex-1'>
                            {/* Title */}
                            <h3 className='text-lg font-semibold mb-1'>
                              {service.name}
                            </h3>

                            {/* Description */}
                            <p className='text-gray-600 mb-3'>
                              {service.description || ''}
                            </p>

                            {/* Badges + Processing inline */}
                            <div className='flex items-center space-x-3 mb-4'>
                              <div className='flex items-center text-sm text-gray-700'>
                                <Clock className='h-4 w-4 mr-1 text-gray-500' />
                                <span>{service.availability || 'N/A'}</span>
                              </div>
                              {service.category && (
                                <Badge variant='secondary'>
                                  {service.category.name}
                                </Badge>
                              )}
                              <Badge
                                variant={
                                  service.status === 'available'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {service.status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Right: Category + Type stacked */}
                        <div className='flex flex-col space-y-2 text-sm text-gray-700 ml-6 w-40'>
                          <div className='flex items-center justify-center border border-gray-300 rounded-md px-2 py-1 bg-white'>
                            <Calendar className='h-4 w-4 mr-2 text-gray-400' />
                            <span>Type: {service.type || 'N/A'}</span>
                          </div>
                          {((service as any).bookingRules ||
                            (service as any).booking_rules) && (
                            <div className='flex items-center justify-center border border-gray-300 rounded-md px-2 py-1 bg-white'>
                              <FileText className='h-4 w-4 mr-2 text-gray-400' />
                              <span>Rules available</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
          </div>
        </main>
      </div>
      <div>
        {' '}
        <Footer />{' '}
      </div>

      {/* Request Modal */}
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Service</DialogTitle>
            <DialogDescription>
              {selectedServiceForRequest && (
                <>Submit a request for "{selectedServiceForRequest.name}"</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            {selectedServiceForRequest && (
              <>
                <div>
                  <Label className='text-sm font-medium'>Service:</Label>
                  <p className='text-sm text-muted-foreground mt-1'>
                    {selectedServiceForRequest.name}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Description:</Label>
                  <p className='text-sm text-muted-foreground mt-1'>
                    {selectedServiceForRequest.description || 'N/A'}
                  </p>
                </div>
              </>
            )}
            <div>
              <Label htmlFor='reason'>Reason for Request (Optional)</Label>
              <Textarea
                id='reason'
                placeholder='Please provide details about your request...'
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={4}
              />
            </div>
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
              disabled={submitting}
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
