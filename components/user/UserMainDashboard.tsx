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
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import Footer from '../Footer';
import { useItems, useCategories } from '@/lib/hooks/useItems';
import { getStatistics } from '@/lib/api/statistics';

import {
  Plane,
  GraduationCap,
  Heart,
  Building,
  Car,
  Users,
  Shield,
  ArrowRight,
  TrendingUp,
  Star,
  Volleyball,
  ShoppingBasket,
  Landmark,
  Warehouse,
  FileCheck2,
  Clock,
} from 'lucide-react';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface MainDashboardProps {
  onNavigate: (
    view: 'dashboard' | 'services' | 'facilities' | 'application' | 'requests',
  ) => void;
  onSelectService?: (service: string) => void;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface Faq1Props {
  heading?: string;
  items?: FaqItem[];
}

// Icon mapping for categories
const categoryIcons: Record<string, any> = {
  education: GraduationCap,
  travel: Plane,
  health: Heart,
  business: Building,
  transport: Car,
  social: Users,
  security: Shield,
  default: FileCheck2,
};

const categoryColors: Record<string, string> = {
  education: 'bg-purple-100 text-purple-600',
  travel: 'bg-green-100 text-green-600',
  health: 'bg-red-100 text-red-600',
  business: 'bg-orange-100 text-orange-600',
  transport: 'bg-indigo-100 text-indigo-600',
  social: 'bg-pink-100 text-pink-600',
  security: 'bg-gray-100 text-gray-600',
  default: 'bg-blue-100 text-blue-600',
};

const facilityIcons: Record<string, any> = {
  basketball: ShoppingBasket,
  'covered-court': Volleyball,
  'multipurpose-hall': Landmark,
  'function-room': Warehouse,
  default: Warehouse,
};

const facilityColors: Record<string, string> = {
  basketball: 'bg-orange-100 text-orange-600',
  'covered-court': 'bg-blue-100 text-blue-800',
  'multipurpose-hall': 'bg-pink-100 text-pink-600',
  'function-room': 'bg-purple-100 text-purple-600',
  default: 'bg-gray-100 text-gray-600',
};

const recentUpdates = [
  {
    title: 'New Support Contact Added',
    date: '2025-10-05',
    type: 'Enhancement',
  },
  {
    title: 'Community Hall Reservation Launched',
    date: '2025-10-11',
    type: 'Enhancement',
  },
  {
    title: 'Maintenance Notice',
    date: '2025-11-21',
    type: 'Update',
  },
];

const Faq1 = ({
  items = [
    {
      id: 'faq-1',
      question: 'What is E-Barangay?',
      answer:
        'E-Barangay is an online portal where residents can easily request barangay services, apply for permits, and reserve local facilities — all in one place.',
    },
    {
      id: 'faq-2',
      question: 'How do I request a barangay service?',
      answer:
        'Go to the Services page, browse the list of available services, and click Apply. Fill out the required form and wait for confirmation from barangay staff.',
    },
    {
      id: 'faq-3',
      question: 'How do I reserve a facility?',
      answer:
        'Navigate to the Facilities section, choose your preferred facility (e.g., basketball court, hall, or covered court), then select your date and submit your reservation request.',
    },
    {
      id: 'faq-4',
      question: 'How can I check the status of my application or reservation?',
      answer:
        'After logging in, open your Dashboard. There you’ll see your submitted requests and their current status (Pending, Approved, or Rejected).',
    },
    {
      id: 'faq-5',
      question:
        'Is there a fee for submitting service requests or reservations?',
      answer:
        'Some services or facility reservations may have fees. You can view the fees beside each service or facility before applying.',
    },
  ],
}: Faq1Props) => {
  return (
    <section className='py-5'>
      <div>
        <Accordion type='single' collapsible>
          {items.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className='font-semibold hover:no-underline'>
                {item.question}
              </AccordionTrigger>
              <AccordionContent className='text-muted-foreground'>
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export function MainDashboard({ onNavigate }: MainDashboardProps) {
  const { items: services, loading: servicesLoading } = useItems('service');
  const { items: facilities, loading: facilitiesLoading } =
    useItems('facility');
  const { categories, loading: categoriesLoading } = useCategories();
  const [stats, setStats] = useState({
    totalServices: 0,
    totalFacilities: 0,
    totalRequests: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const statistics = await getStatistics();
        setStats({
          totalServices: statistics.totalServices,
          totalFacilities: statistics.totalFacilities,
          totalRequests: statistics.totalRequests,
        });
      } catch (error) {
        console.error('Failed to load statistics:', error);
      }
    }
    loadStats();
  }, []);

  // Group services by category
  const serviceCategories = categories
    .map((category) => {
      const categoryServices = services.filter((s) => {
        const categoryId = (s as any).categoryId || (s as any).category_id;
        return categoryId === category.id;
      });
      if (categoryServices.length === 0) return null;

      const categoryName = category.name.toLowerCase();
      return {
        id: category.id,
        title: category.name,
        description: category.description || '',
        icon: categoryIcons[categoryName] || categoryIcons.default,
        count: categoryServices.length,
        color: categoryColors[categoryName] || categoryColors.default,
        popular: categoryServices.length >= 3,
      };
    })
    .filter(Boolean) as any[];

  // Group facilities by category/type
  const facilityReservation = categories
    .map((category) => {
      const categoryFacilities = facilities.filter((f) => {
        const categoryId = (f as any).categoryId || (f as any).category_id;
        return categoryId === category.id;
      });
      if (categoryFacilities.length === 0) return null;

      const categoryName = category.name.toLowerCase().replace(/\s+/g, '-');
      return {
        id: category.id,
        title: category.name,
        description: category.description || '',
        icon: facilityIcons[categoryName] || facilityIcons.default,
        count: categoryFacilities.length,
        color: facilityColors[categoryName] || facilityColors.default,
        popular: categoryFacilities.length >= 2,
      };
    })
    .filter(Boolean) as any[];

  if (servicesLoading || facilitiesLoading || categoriesLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className='min-h-screen bg-gradient-to-b from-blue-50 to-gray-200 p-6 rounded-lg m-5'>
        <Header />

        <main className='max-w-7xl mx-auto px-4 py-8'>
          {/* Hero Section */}

          <div className='grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-12 items-center p-8 md:p-12'>
            {/* Left Side - Title + Description + Buttons */}
            <div>
              <h1 className='text-4xl font-bold text-gray-900 leading-tight'>
                Welcome to E-Barangay.
              </h1>
              <p className='mt-4 text-lg text-gray-600'>
                Request, apply, and schedule online - pick up when ready.
              </p>

              <div className='mt-6 flex space-x-4'>
                <button
                  onClick={() =>
                    document
                      .getElementById('permits')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition'
                >
                  Get started
                </button>
                <button
                  className='bg-white shadow px-5 py-3 rounded-lg font-medium text-gray-800 hover:shadow-md transition'
                  onClick={() => onNavigate('services')}
                >
                  Browse All Services →
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className='hidden md:block h-full w-px bg-[repeating-linear-gradient(180deg,transparent,transparent_4px,currentColor_4px,currentColor_10px)] [mask-image:linear-gradient(180deg,transparent,black_25%,black_75%,transparent)]'></div>

            {/* Right Side - Features */}
            <div className='space-y-6'>
              <div className='flex items-start space-x-4'>
                <FileCheck2 className='font-semibold text-blue-800' />
                <div>
                  <h3 className='font-semibold text-gray-900'>
                    Barangay Services
                  </h3>
                  <p className='text-gray-600 text-sm'>
                    Access barangay certificates, assistance, and programs
                    online — simple and fast.
                  </p>
                </div>
              </div>

              <div className='flex items-start space-x-4'>
                <Volleyball className='font-semibold text-blue-800' />
                <div>
                  <h3 className='font-semibold text-gray-900'>
                    Reserve Facilities
                  </h3>
                  <p className='text-gray-600 text-sm'>
                    Book barangay halls, sports courts, and other local
                    facilities quickly and hassle-free.
                  </p>
                </div>
              </div>

              <div className='flex items-start space-x-4'>
                <GraduationCap className='font-semibold text-blue-800' />
                <div>
                  <h3 className='font-semibold text-gray-900'>
                    Carved by CvSU Computer Science Students
                  </h3>
                  <p className='text-gray-600 text-sm'>
                    A proudly built E-Barangay system developed to bring digital
                    convenience to your local community.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div id='permits' className='grid lg:grid-cols-3 gap-8'>
            {/* Main Content */}
            <div className='lg:col-span-2'>
              {/* Service Categories */}
              <div className='mb-8 bg-blue-200 p-6 rounded-lg'>
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-2xl'>Permits & Licenses</h2>
                  <Button
                    variant='outline'
                    onClick={() => onNavigate('services')}
                  >
                    View All
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                </div>

                <div className='grid md:grid-cols-2 gap-4'>
                  {serviceCategories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <Card
                        key={category.id}
                        className='hover:shadow-lg transition-shadow cursor-pointer relative'
                        onClick={() => onNavigate('services')}
                      >
                        <CardHeader className='pb-3'>
                          <div className='flex items-start justify-between'>
                            <div className={`p-3 rounded-lg ${category.color}`}>
                              <IconComponent className='h-6 w-6' />
                            </div>
                            <div className='flex flex-col items-end space-y-1'>
                              <Badge variant='secondary'>
                                {category.count} services
                              </Badge>
                              {category.popular && (
                                <Badge className='bg-yellow-100 text-yellow-800'>
                                  <Star className='h-3 w-3 mr-1' />
                                  Popular
                                </Badge>
                              )}
                            </div>
                          </div>
                          <CardTitle className='text-lg'>
                            {category.title}
                          </CardTitle>
                          <CardDescription>
                            {category.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Facility Reservation */}
              <div className='mb-8 bg-blue-200 p-6 rounded-lg'>
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-2xl'>Facilities Reservation</h2>
                  <Button
                    variant='outline'
                    onClick={() => onNavigate('facilities')}
                  >
                    View All
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                </div>

                <div className='grid md:grid-cols-2 gap-4'>
                  {facilityReservation.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <Card
                        key={category.id}
                        className='hover:shadow-lg transition-shadow cursor-pointer relative'
                        onClick={() => onNavigate('facilities')}
                      >
                        <CardHeader className='pb-3'>
                          <div className='flex items-start justify-between'>
                            <div className={`p-3 rounded-lg ${category.color}`}>
                              <IconComponent className='h-6 w-6' />
                            </div>
                            <div className='flex flex-col items-end space-y-1'>
                              <Badge variant='secondary'>
                                {category.count} facility
                              </Badge>
                              {category.popular && (
                                <Badge className='bg-yellow-100 text-yellow-800'>
                                  <Star className='h-3 w-3 mr-1' />
                                  Popular
                                </Badge>
                              )}
                            </div>
                          </div>
                          <CardTitle className='text-lg'>
                            {category.title}
                          </CardTitle>
                          <CardDescription>
                            {category.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className='space-y-6'>
              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center font-semibold'>
                    <TrendingUp className='h-5 w-5 mr-2' />
                    Your Request Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm'>Total Requests</span>
                    <span className='font-semibold'>{stats.totalRequests}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Frequently Asked Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className='font-semibold text-3xl'>
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>
                    Your guide to getting started with E-Barangay’s digital
                    services.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Faq1 />
                </CardContent>
              </Card>

              {/* Help & Support */}
              <Card>
                <CardHeader>
                  <CardTitle className='font-semibold'>Need Help?</CardTitle>
                  <CardDescription>
                    Get assistance with government services
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant='outline'
                        className='w-full justify-start'
                      >
                        📞 Contact Support
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='sm:max-w-[425px]'>
                      <div className='grid gap-4'>
                        <div className='grid gap-3'>
                          <Label htmlFor='name-1'>
                            Bacoor Cavite Customer Service
                          </Label>
                          <Button
                            type='submit'
                            className='bg-blue-500 hover:bg-blue-400 text-white'
                          >
                            📞 +639477240991{' '}
                          </Button>
                        </div>
                        <div className='grid gap-3'>
                          <Label htmlFor='username-1'>
                            Bacoor Cavite Hotline
                          </Label>
                          <Button
                            type='submit'
                            className='bg-yellow-500 hover:bg-yellow-400 text-white'
                          >
                            📞 +639813649935{' '}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
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
