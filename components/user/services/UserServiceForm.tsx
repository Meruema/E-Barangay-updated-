'use client'

import { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import { getItemById } from "@/lib/api/items";
import { createRequest } from "@/lib/api/requests";
import { ItemWithCategory } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Eye, Loader2, Save } from 'lucide-react';

interface ServiceFormProps {
  service: string | null; 
  onNavigate: (view: 'dashboard' | 'services' | 'facilities' | 'application' | 'requests') => void;
}

export function ServiceForm({ service, onNavigate }: ServiceFormProps) {
  const [item, setItem] = useState<ItemWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Parse requirements from item
  const bookingRules = item ? ((item as any).bookingRules || (item as any).booking_rules) : null;
  const requirements = bookingRules
    ? bookingRules.split(',').map((r: string) => r.trim()).filter(Boolean)
    : ['Name', 'Contact Number', 'Purpose'];

  // Create dynamic form schema
  const defaultValues = requirements.reduce((acc: any, req: string) => {
    acc[req] = '';
    return acc;
  }, {});

  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors, isValid },
    reset,
    setValue
  } = useForm({
    mode: 'onChange',
    defaultValues
  });

  const formValues = watch();

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

    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }

    loadItem();
    loadUser();
  }, [service]);

  // Auto-save functionality
  useEffect(() => {
    if (isDirty && service && userId) {
      const autoSaveTimer = setTimeout(() => {
        localStorage.setItem(`draft_${service}_${userId}`, JSON.stringify(formValues));
        console.log('Draft auto-saved');
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [formValues, isDirty, service, userId]);

  // Load draft on mount
  useEffect(() => {
    if (service && userId) {
      const savedDraft = localStorage.getItem(`draft_${service}_${userId}`);
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          Object.keys(draftData).forEach(key => {
            setValue(key, draftData[key]);
          });
          setIsDirty(true);
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    }
  }, [service, userId, setValue]);

  // Mark form as dirty when user types
  useEffect(() => {
    const subscription = watch(() => setIsDirty(true));
    return () => subscription.unsubscribe();
  }, [watch]);

  const onSubmit = async (data: any) => {
    if (!item || !userId) {
      alert("Please log in to submit a request");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitStatus('idle');
      setErrorMessage('');

      // Format the reason from form data
      const reason = Object.entries(data)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      await createRequest(userId, item.id, reason);
      
      setSubmitStatus('success');
      // Clear draft after successful submission
      localStorage.removeItem(`draft_${service}_${userId}`);
      reset();
      setIsDirty(false);

      // Redirect after 2 seconds
      setTimeout(() => {
        onNavigate('requests');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit request:', error);
      setSubmitStatus('error');
      setErrorMessage('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearDraft = () => {
    if (service && userId) {
      localStorage.removeItem(`draft_${service}_${userId}`);
      reset();
      setIsDirty(false);
    }
  };

  // Get validation rules based on field name
  const getValidationRules = (fieldName: string) => {
    const lowerFieldName = fieldName.toLowerCase();
    
    if (lowerFieldName.includes('email')) {
      return {
        required: `${fieldName} is required`,
        pattern: {
          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          message: 'Invalid email address'
        }
      };
    }
    
    if (lowerFieldName.includes('phone') || lowerFieldName.includes('contact')) {
      return {
        required: `${fieldName} is required`,
        pattern: {
          value: /^[0-9+\-\s()]+$/,
          message: 'Invalid phone number format'
        },
        minLength: {
          value: 10,
          message: 'Phone number must be at least 10 digits'
        }
      };
    }
    
    if (lowerFieldName.includes('name')) {
      return {
        required: `${fieldName} is required`,
        minLength: {
          value: 2,
          message: `${fieldName} must be at least 2 characters`
        }
      };
    }
    
    // Default validation
    return {
      required: `${fieldName} is required`,
      minLength: {
        value: 2,
        message: `${fieldName} must be at least 2 characters`
      }
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Service not found.</div>
      </div>
    );
  }

  // Preview View
  if (showPreview) {
    return (
      <Card className="max-w-xl mx-auto m-5">
        <CardHeader>
          <CardTitle>Preview Your Request</CardTitle>
          <CardDescription>Review your information before submitting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-1">{item.name}</h3>
            <p className="text-sm text-blue-700">{item.description}</p>
          </div>

          <div className="space-y-3">
            {Object.entries(formValues).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b pb-2">
                <span className="font-semibold">{key}:</span>
                <span className="text-gray-700">{value as string}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(false)}
              className="flex-1"
            >
               Back to Edit
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Confirm & Submit'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main Form View
  return (
    <Card className="max-w-xl mx-auto m-5">
      <CardHeader>
        <CardTitle className="text-2xl">{item.name} Application</CardTitle>
        {item.description && (
          <CardDescription>{item.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(() => setShowPreview(true))} className="space-y-4">
          {/* Success/Error Messages */}
          {submitStatus === 'success' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Request submitted successfully! Redirecting to your requests...
              </AlertDescription>
            </Alert>
          )}

          {submitStatus === 'error' && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Dynamic Form Fields */}
          {requirements.map((req: string, idx: number) => {
            const isTextArea = req.toLowerCase().includes('address') || 
                              req.toLowerCase().includes('purpose') ||
                              req.toLowerCase().includes('reason');
            
            return (
              <div key={idx} className="space-y-2">
                <Label htmlFor={req}>
                  {req} <span className="text-red-500">*</span>
                </Label>
                {isTextArea ? (
                  <Textarea
                    id={req}
                    {...register(req, getValidationRules(req))}
                    placeholder={`Enter ${req}`}
                    rows={3}
                    className={errors[req] ? 'border-red-500' : ''}
                  />
                ) : (
                  <Input
                    id={req}
                    {...register(req, getValidationRules(req))}
                    placeholder={`Enter ${req}`}
                    className={errors[req] ? 'border-red-500' : ''}
                  />
                )}
                {errors[req] && (
                  <p className="text-sm text-red-500">{errors[req]?.message as string}</p>
                )}
              </div>
            );
          })}

          {/* Draft Status */}
          {isDirty && (
            <Alert>
              <Save className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span className="text-sm">✅ Draft auto-saved</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearDraft}
                >
                  Clear Draft
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onNavigate('services')}
              className="flex-1"
              disabled={submitting}
            >
              Back
            </Button>

            <Button
              type="submit"
              disabled={!isValid || submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview Request
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
