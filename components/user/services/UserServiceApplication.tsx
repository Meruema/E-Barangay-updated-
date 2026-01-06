'use client';

import { useState, useEffect } from 'react';
import { Header } from '../UserHeader';
import { getItemById } from '@/lib/api/items';
import { ItemWithCategory } from '@/lib/database.types';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Checkbox } from '../../ui/checkbox';
import { Progress } from '../../ui/progress';
import { Alert, AlertDescription } from '../../ui/alert';
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
import {
  ArrowLeft,
  Clock,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
  Phone,
  Mail,
  Calendar,
  Shield,
} from 'lucide-react';

interface ServiceApplicationProps {
  service: string | null;
  onNavigate: (
    view: 'dashboard' | 'services' | 'facilities' | 'application' | 'requests',
  ) => void;
}

export function ServiceApplication({
  service,
  onNavigate,
}: ServiceApplicationProps) {
  const [item, setItem] = useState<ItemWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    passportNumber: '',
    dateOfBirth: '',
    purposeOfVisit: '',
    arrivalDate: '',
    departureDate: '',
    address: '',
    agreeToTerms: false,
  });

  useEffect(() => {
    async function loadItem() {
      if (!service) {
        setLoading(false);
        return;
      }

      try {
        const itemData = await getItemById(service);
        setItem(itemData);
      } catch (error) {
        console.error('Failed to load item:', error);
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [service]);

  // Parse requirements from booking_rules or use defaults
  const bookingRules = item
    ? (item as any).bookingRules || (item as any).booking_rules
    : null;
  const requirements = bookingRules
    ? bookingRules
        .split(',')
        .map((r: string) => r.trim())
        .filter(Boolean)
    : ['Valid ID', 'Accomplished request form', 'Cedula'];

  const details = item
    ? {
        title: item.name || 'Service',
        description: item.description || '',
        processingTime: item.availability || 'N/A',
        fee: 'Check with barangay',
        requirements: requirements,
        steps: [
          'Fill application form',
          'Submit required documents',
          'Wait for processing',
          'Receive confirmation',
        ],
        availability: item.availability || 'Business hours',
      }
    : null;
  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <Header />

      <main className='max-w-6xl mx-auto px-4 py-8'>
        {/* Back Navigation */}
        <div className='mb-6'>
          <Button
            variant='ghost'
            onClick={() => onNavigate('services')}
            className='mb-4'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Services
          </Button>

          <h1 className='text-3xl mb-2'>{details?.title}</h1>
          <p className='text-gray-600'>{details?.description}</p>
        </div>

        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Main Application Form */}
          <div className='lg:col-span-2'>
            {/* Progress Bar */}
            <Card className='mb-6'>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium'>
                    Application Progress
                  </span>
                  <span className='text-sm text-gray-600'>
                    Step {currentStep} of {totalSteps}
                  </span>
                </div>
                <Progress value={progress} className='h-2' />
                <div className='flex justify-between mt-2 text-xs text-gray-500'>
                  <span>Personal Info</span>
                  <span>Documents</span>
                  <span>Payment</span>
                  <span>Review</span>
                </div>
              </CardContent>
            </Card>

            {/* Application Form */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Step {currentStep}:{' '}
                  {currentStep === 1
                    ? 'Personal Information'
                    : currentStep === 2
                    ? 'Document Upload'
                    : currentStep === 3
                    ? 'Payment Details'
                    : 'Review & Submit'}
                </CardTitle>
                <CardDescription>
                  {currentStep === 1 &&
                    'Please provide your personal details as they appear on your passport'}
                  {currentStep === 2 &&
                    'Upload the required documents in PDF or JPG format'}
                  {currentStep === 3 &&
                    'Complete your payment to process the application'}
                  {currentStep === 4 &&
                    'Review all information before submitting your application'}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <div className='space-y-4'>
                    <div className='grid md:grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='firstName'>First Name *</Label>
                        <Input
                          id='firstName'
                          value={formData.firstName}
                          onChange={(e) =>
                            handleInputChange('firstName', e.target.value)
                          }
                          placeholder='Enter your first name'
                        />
                      </div>
                      <div>
                        <Label htmlFor='lastName'>Last Name *</Label>
                        <Input
                          id='lastName'
                          value={formData.lastName}
                          onChange={(e) =>
                            handleInputChange('lastName', e.target.value)
                          }
                          placeholder='Enter your last name'
                        />
                      </div>
                    </div>

                    <div className='grid md:grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='email'>Email Address *</Label>
                        <Input
                          id='email'
                          type='email'
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange('email', e.target.value)
                          }
                          placeholder='your.email@example.com'
                        />
                      </div>
                      <div>
                        <Label htmlFor='phone'>Phone Number *</Label>
                        <Input
                          id='phone'
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange('phone', e.target.value)
                          }
                          placeholder='+94771234567'
                        />
                      </div>
                    </div>

                    <div className='grid md:grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='nationality'>Nationality *</Label>
                        <Select
                          onValueChange={(value) =>
                            handleInputChange('nationality', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select nationality' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='us'>United States</SelectItem>
                            <SelectItem value='uk'>United Kingdom</SelectItem>
                            <SelectItem value='ca'>Canada</SelectItem>
                            <SelectItem value='au'>Australia</SelectItem>
                            <SelectItem value='de'>Germany</SelectItem>
                            <SelectItem value='fr'>France</SelectItem>
                            <SelectItem value='in'>India</SelectItem>
                            <SelectItem value='jp'>Japan</SelectItem>
                            <SelectItem value='cn'>China</SelectItem>
                            <SelectItem value='sg'>Singapore</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='passportNumber'>
                          Passport Number *
                        </Label>
                        <Input
                          id='passportNumber'
                          value={formData.passportNumber}
                          onChange={(e) =>
                            handleInputChange('passportNumber', e.target.value)
                          }
                          placeholder='A12345678'
                        />
                      </div>
                    </div>

                    <div className='grid md:grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='dateOfBirth'>Date of Birth *</Label>
                        <Input
                          id='dateOfBirth'
                          type='date'
                          value={formData.dateOfBirth}
                          onChange={(e) =>
                            handleInputChange('dateOfBirth', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor='purposeOfVisit'>
                          Purpose of Visit *
                        </Label>
                        <Select
                          onValueChange={(value) =>
                            handleInputChange('purposeOfVisit', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select purpose' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='tourism'>Tourism</SelectItem>
                            <SelectItem value='business'>Business</SelectItem>
                            <SelectItem value='transit'>Transit</SelectItem>
                            <SelectItem value='conference'>
                              Conference
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className='grid md:grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='arrivalDate'>Arrival Date *</Label>
                        <Input
                          id='arrivalDate'
                          type='date'
                          value={formData.arrivalDate}
                          onChange={(e) =>
                            handleInputChange('arrivalDate', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor='departureDate'>Departure Date *</Label>
                        <Input
                          id='departureDate'
                          type='date'
                          value={formData.departureDate}
                          onChange={(e) =>
                            handleInputChange('departureDate', e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor='address'>Address in Sri Lanka</Label>
                      <Textarea
                        id='address'
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange('address', e.target.value)
                        }
                        placeholder='Hotel address or local contact address&#10;Example: Horizon Campus, Malabe, Colombo'
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Document Upload */}
                {currentStep === 2 && (
                  <div className='space-y-4'>
                    <Alert>
                      <AlertCircle className='h-4 w-4' />
                      <AlertDescription>
                        Please ensure all documents are clear, readable, and in
                        PDF or JPG format (max 5MB each).
                      </AlertDescription>
                    </Alert>

                    {details?.requirements.map(
                      (requirement: string, index: number) => (
                        <div
                          key={index}
                          className='border border-gray-200 rounded-lg p-4'
                        >
                          <div className='flex items-start justify-between mb-3'>
                            <div>
                              <h4 className='font-medium'>{requirement}</h4>
                              <p className='text-sm text-gray-600 mt-1'>
                                {index === 0 &&
                                  'Main identification page of passport'}
                                {index === 1 &&
                                  'Recent passport-sized photograph with white background'}
                                {index === 2 &&
                                  'Hotel booking confirmation or travel itinerary'}
                                {index === 3 &&
                                  'Return or onward flight booking confirmation'}
                                {index === 4 && 'Last 3 months bank statements'}
                                {index === 5 &&
                                  'Travel insurance policy document'}
                              </p>
                            </div>
                            <Badge
                              variant={index < 2 ? 'destructive' : 'secondary'}
                            >
                              {index < 2 ? 'Required' : 'Optional'}
                            </Badge>
                          </div>
                          <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                            <Upload className='h-8 w-8 text-gray-400 mx-auto mb-2' />
                            <p className='text-sm text-gray-600 mb-2'>
                              Drag and drop your file here, or click to browse
                            </p>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() =>
                                alert(
                                  `File upload for: ${requirement}\n\nSupported formats: PDF, JPG, PNG\nMax size: 5MB\n\nClick OK to simulate file selection.`,
                                )
                              }
                            >
                              Choose File
                            </Button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {/* Step 3: Payment */}
                {currentStep === 3 && (
                  <div className='space-y-6'>
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='font-medium text-blue-900'>
                            Visa Application Fee
                          </h4>
                          <p className='text-sm text-blue-700'>
                            Tourist/Business Visa (30 days)
                          </p>
                        </div>
                        <div className='text-2xl font-bold text-blue-900'>
                          USD 35
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Payment Method</Label>
                      <div className='grid md:grid-cols-2 gap-4 mt-2'>
                        <Card className='cursor-pointer hover:shadow-md border-2'>
                          <CardContent className='p-4 text-center'>
                            <div className='text-2xl mb-2'>💳</div>
                            <div className='font-medium'>Credit/Debit Card</div>
                            <div className='text-sm text-gray-600'>
                              Visa, Mastercard, Amex
                            </div>
                          </CardContent>
                        </Card>
                        <Card className='cursor-pointer hover:shadow-md border-2 opacity-50'>
                          <CardContent className='p-4 text-center'>
                            <div className='text-2xl mb-2'>🏦</div>
                            <div className='font-medium'>Bank Transfer</div>
                            <div className='text-sm text-gray-600'>
                              Coming soon
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <div className='space-y-4'>
                      <div>
                        <Label htmlFor='cardNumber'>Card Number</Label>
                        <Input
                          id='cardNumber'
                          placeholder='1234 5678 9012 3456'
                        />
                      </div>
                      <div className='grid md:grid-cols-3 gap-4'>
                        <div>
                          <Label htmlFor='expiry'>Expiry Date</Label>
                          <Input id='expiry' placeholder='MM/YY' />
                        </div>
                        <div>
                          <Label htmlFor='cvv'>CVV</Label>
                          <Input id='cvv' placeholder='123' />
                        </div>
                        <div>
                          <Label htmlFor='postalCode'>Postal Code</Label>
                          <Input id='postalCode' placeholder='12345' />
                        </div>
                      </div>
                    </div>

                    <Alert>
                      <Shield className='h-4 w-4' />
                      <AlertDescription>
                        Your payment is secured with 256-bit SSL encryption and
                        processed by our certified payment gateway.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 4 && (
                  <div className='space-y-6'>
                    <Alert>
                      <CheckCircle className='h-4 w-4' />
                      <AlertDescription>
                        Please review all information carefully before
                        submitting your application.
                      </AlertDescription>
                    </Alert>

                    <div className='space-y-4'>
                      <div>
                        <h4 className='font-medium mb-2'>
                          Personal Information
                        </h4>
                        <div className='bg-gray-50 rounded-lg p-4 space-y-2'>
                          <div className='grid md:grid-cols-2 gap-4 text-sm'>
                            <div>
                              Name: {formData.firstName} {formData.lastName}
                            </div>
                            <div>Email: {formData.email}</div>
                            <div>Phone: {formData.phone}</div>
                            <div>Nationality: {formData.nationality}</div>
                            <div>Passport: {formData.passportNumber}</div>
                            <div>Purpose: {formData.purposeOfVisit}</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className='font-medium mb-2'>Travel Details</h4>
                        <div className='bg-gray-50 rounded-lg p-4'>
                          <div className='grid md:grid-cols-2 gap-4 text-sm'>
                            <div>Arrival: {formData.arrivalDate}</div>
                            <div>Departure: {formData.departureDate}</div>
                          </div>
                          {formData.address && (
                            <div className='mt-2 text-sm'>
                              <div>Sri Lanka Address: {formData.address}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className='font-medium mb-2'>Payment Summary</h4>
                        <div className='bg-gray-50 rounded-lg p-4'>
                          <div className='flex justify-between items-center'>
                            <span>Visa Application Fee</span>
                            <span className='font-semibold'>USD 35</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='terms'
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) =>
                          handleInputChange('agreeToTerms', checked)
                        }
                      />
                      <Label htmlFor='terms' className='text-sm'>
                        I agree to the{' '}
                        <button
                          onClick={() =>
                            alert(
                              'Terms and Conditions:\n\n• All information must be accurate\n• False information may result in rejection\n• Processing fees are non-refundable\n• Applications are processed in order\n• Visa validity as per approval\n• Subject to Sri Lankan immigration laws',
                            )
                          }
                          className='text-blue-600 hover:underline'
                        >
                          Terms and Conditions
                        </button>{' '}
                        and confirm that all information provided is accurate.
                      </Label>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className='flex justify-between pt-6 border-t'>
                  <Button
                    variant='outline'
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>

                  {currentStep < totalSteps ? (
                    <Button onClick={nextStep}>Next Step</Button>
                  ) : (
                    <Button
                      onClick={() => {
                        // Handle form submission
                        alert(
                          '🎉 Application Submitted Successfully!\n\nReference Number: VSA-2024-001234\n\n✅ Payment processed: USD 35\n✅ Documents uploaded\n✅ Application under review\n\nYou will receive updates via:\n📧 Email notifications\n📱 SMS to +94771234567\n📍 Collection at: Horizon Campus, Malabe\n\nProcessing time: 3-5 business days',
                        );
                        // Optionally redirect to dashboard
                        onNavigate('dashboard');
                      }}
                      disabled={!formData.agreeToTerms}
                    >
                      Submit Application
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='lg:col-span-1 space-y-6'>
            {/* Service Summary */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <FileText className='h-5 w-5 mr-2' />
                  Service Details
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <Clock className='h-4 w-4 mr-2 text-gray-400' />
                    <span className='text-sm'>Processing Time</span>
                  </div>
                  <span className='text-sm font-medium'>
                    {details?.processingTime}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <DollarSign className='h-4 w-4 mr-2 text-gray-400' />
                    <span className='text-sm'>Fee</span>
                  </div>
                  <span className='text-sm font-medium'>{details?.fee}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <Calendar className='h-4 w-4 mr-2 text-gray-400' />
                    <span className='text-sm'>Availability</span>
                  </div>
                  <Badge variant='secondary' className='text-xs'>
                    24/7
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Required Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2 text-sm'>
                  {details?.requirements.map((req: string, index: number) => (
                    <li key={index} className='flex items-start'>
                      <CheckCircle className='h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0' />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  size='sm'
                  onClick={() =>
                    alert(
                      'Support Hotline:\n\n📞 1919 (24/7 Free Hotline)\n📞 +94112345678 (International)\n\nAvailable in Sinhala, Tamil, and English',
                    )
                  }
                >
                  <Phone className='h-4 w-4 mr-2' />
                  Call Support
                </Button>
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  size='sm'
                  onClick={() =>
                    alert(
                      'Email Support:\n\n📧 support@gov.lk\n📧 visa@gov.lk (Visa queries)\n📧 tech@gov.lk (Technical issues)\n\nResponse time: 24-48 hours',
                    )
                  }
                >
                  <Mail className='h-4 w-4 mr-2' />
                  Email Support
                </Button>
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  size='sm'
                  onClick={() =>
                    alert(
                      'Downloading application guide...\n\nThe guide includes:\n• Step-by-step instructions\n• Required documents\n• Common issues\n• Contact information',
                    )
                  }
                >
                  <Download className='h-4 w-4 mr-2' />
                  Download Guide
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
