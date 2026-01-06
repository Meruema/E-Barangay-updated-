'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

import { signUp } from '@/app/actions/auth';
import { toast } from 'sonner';

interface SignupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
}
export function SignupForm({
  open,
  onOpenChange,
  onSwitchToLogin,
}: SignupFormProps) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [blkLot, setBlkLot] = useState('');
  const [street, setStreet] = useState('');
  const [barangays, setBarangays] = useState<{ id: string; name: string }[]>(
    [],
  );
  // Document upload state
  const [idFile, setIdFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);
  const [idFileUrl, setIdFileUrl] = useState<string | null>(null);
  const [addressFileUrl, setAddressFileUrl] = useState<string | null>(null);
  const [barangay, setBarangay] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch barangays from API on mount
  useEffect(() => {
    async function fetchBarangays() {
      try {
        const res = await fetch('/api/barangays');
        const data = await res.json();
        setBarangays(data);
        if (data.length > 0) setBarangay(data[0].id);
      } catch (e) {
        setBarangays([]);
      }
    }
    fetchBarangays();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < 3) {
      // Only advance step, do not submit
      if (
        (step === 1 && fullName) ||
        (step === 2 && barangay && blkLot && street)
      ) {
        setStep(step + 1);
      }
      return;
    }
    // Step 3: Upload files and submit
    if (!idFile || !addressFile) {
      toast.error('Please upload both ID and proof of address.');
      return;
    }
    setLoading(true);
    try {
      // Upload ID file
      const idForm = new FormData();
      idForm.append('file', idFile);
      idForm.append('type', 'valid_id');
      const idRes = await fetch('/api/upload', {
        method: 'POST',
        body: idForm,
      });
      const idData = await idRes.json();
      if (!idRes.ok) throw new Error(idData.error || 'Failed to upload ID');
      setIdFileUrl(idData.url);

      // Upload address file
      const addressForm = new FormData();
      addressForm.append('file', addressFile);
      addressForm.append('type', 'proof_of_address');
      const addressRes = await fetch('/api/upload', {
        method: 'POST',
        body: addressForm,
      });
      const addressData = await addressRes.json();
      if (!addressRes.ok)
        throw new Error(
          addressData.error || 'Failed to upload proof of address',
        );
      setAddressFileUrl(addressData.url);

      // Submit signup
      const result = await signUp(
        email,
        password,
        fullName,
        blkLot,
        street,
        barangay,
        idData.url,
        addressData.url,
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Account created successfully!');
        onOpenChange(false);
        setEmail('');
        setPassword('');
        setFullName('');
        setBlkLot('');
        setStreet('');
        setIdFile(null);
        setAddressFile(null);
        setIdFileUrl(null);
        setAddressFileUrl(null);
        if (barangays.length > 0) setBarangay(barangays[0].id);
        setStep(1);
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Sign Up</DialogTitle>
          <DialogDescription>
            Create a new account to access E-Barangay services
          </DialogDescription>
        </DialogHeader>

        {/* Creative Progress Stepper */}
        <div className='flex items-center justify-center mb-6 gap-0 relative'>
          {[
            {
              label: 'Name',
              icon: (
                <svg
                  width='20'
                  height='20'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <circle cx='10' cy='7' r='3' />
                  <path d='M2 18c0-3.5 3.5-6 8-6s8 2.5 8 6' />
                </svg>
              ),
            },
            {
              label: 'Address',
              icon: (
                <svg
                  width='20'
                  height='20'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <rect x='3' y='7' width='14' height='10' rx='2' />
                  <path d='M7 7V5a3 3 0 0 1 6 0v2' />
                </svg>
              ),
            },
            {
              label: 'Documents',
              icon: (
                <svg
                  width='20'
                  height='20'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <rect x='4' y='4' width='12' height='16' rx='2' />
                  <path d='M8 2v4h8' />
                </svg>
              ),
            },
            {
              label: 'Account',
              icon: (
                <svg
                  width='20'
                  height='20'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <rect x='3' y='7' width='14' height='10' rx='2' />
                  <circle cx='10' cy='12' r='3' />
                </svg>
              ),
            },
          ].map((s, idx, arr) => (
            <div key={s.label} className='flex items-center relative z-10'>
              <div
                className={`flex flex-col items-center transition-all duration-200 ${
                  step === idx + 1 ? 'scale-110' : 'opacity-60'
                }`}
              >
                <div
                  className={`rounded-full border-2 flex items-center justify-center w-10 h-10 mb-1 ${
                    step === idx + 1
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {s.icon}
                </div>
                <span
                  className={`text-xs font-medium ${
                    step === idx + 1 ? 'text-blue-700' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < arr.length - 1 && (
                <div
                  className='w-8 h-1 bg-gradient-to-r from-blue-200 to-blue-600 mx-1 rounded-full relative top-4'
                  style={{ opacity: step > idx + 1 ? 1 : 0.4 }}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {step === 1 && (
            <div className='space-y-2'>
              <Label htmlFor='fullName'>Full Name</Label>
              <Input
                id='fullName'
                type='text'
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                maxLength={50}
                disabled={loading}
                placeholder='Juan Dela Cruz'
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <>
              <div className='space-y-2'>
                <Label>Barangay</Label>
                <Select
                  value={barangay}
                  onValueChange={setBarangay}
                  disabled={loading || barangays.length === 0}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select barangay' />
                  </SelectTrigger>
                  <SelectContent>
                    {barangays.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='border rounded-lg p-4 bg-muted/50 mb-2'>
                <div className='mb-2'>
                  <span className='font-semibold text-sm flex items-center gap-2'>
                    <svg
                      width='18'
                      height='18'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      className='inline-block'
                    >
                      <rect x='2' y='5' width='14' height='10' rx='2' />
                      <path d='M6 5V3h6v2' />
                    </svg>
                    Address Details
                  </span>
                  <p className='text-xs text-muted-foreground ml-6'>
                    Please enter your residence details below (excluding
                    barangay).
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='blkLot' className='flex items-center gap-1'>
                    <svg
                      width='16'
                      height='16'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      className='inline-block'
                    >
                      <rect x='2' y='4' width='12' height='8' rx='2' />
                    </svg>
                    Blk & Lot Number
                  </Label>
                  <Input
                    id='blkLot'
                    type='text'
                    value={blkLot}
                    onChange={(e) => setBlkLot(e.target.value)}
                    required
                    maxLength={30}
                    disabled={loading}
                    placeholder='e.g. Blk 1 Lot 2'
                    autoComplete='address-line1'
                  />
                  <p className='text-xs text-muted-foreground ml-1'>
                    Example: Blk 1 Lot 2
                  </p>
                </div>
                <div className='space-y-2 mt-2'>
                  <Label htmlFor='street' className='flex items-center gap-1'>
                    <svg
                      width='16'
                      height='16'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      className='inline-block'
                    >
                      <path d='M2 8h12' />
                      <circle cx='4' cy='8' r='2' />
                      <circle cx='12' cy='8' r='2' />
                    </svg>
                    Street
                  </Label>
                  <Input
                    id='street'
                    type='text'
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                    maxLength={60}
                    disabled={loading}
                    placeholder='e.g. Mabini St.'
                    autoComplete='address-line2'
                  />
                  <p className='text-xs text-muted-foreground ml-1'>
                    Example: Mabini St.
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className='space-y-2'>
                <Label htmlFor='idFile'>Upload Valid ID</Label>
                <Input
                  id='idFile'
                  type='file'
                  accept='.png,.jpg,.jpeg'
                  onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                  required
                  disabled={loading}
                />
                {idFile && (
                  <div className='mt-1 flex flex-col gap-1'>
                    <span className='text-xs'>{idFile.name}</span>
                    {idFile.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(idFile)}
                        alt='ID Preview'
                        className='mt-1 max-h-32 rounded border shadow'
                      />
                    ) : idFile.type === 'application/pdf' ? (
                      <a
                        href={URL.createObjectURL(idFile)}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-xs text-blue-600 underline'
                      >
                        Preview PDF
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='addressFile'>Upload Proof of Address</Label>
                <Input
                  id='addressFile'
                  type='file'
                  accept='.png,.jpg,.jpeg'
                  onChange={(e) => setAddressFile(e.target.files?.[0] || null)}
                  required
                  disabled={loading}
                />
                {addressFile && (
                  <div className='mt-1 flex flex-col gap-1'>
                    <span className='text-xs'>{addressFile.name}</span>
                    {addressFile.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(addressFile)}
                        alt='Proof of Address Preview'
                        className='mt-1 max-h-32 rounded border shadow'
                      />
                    ) : addressFile.type === 'application/pdf' ? (
                      <a
                        href={URL.createObjectURL(addressFile)}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-xs text-blue-600 underline'
                      >
                        Preview PDF
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Document upload step */}

          {step === 4 && (
            <>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div className='flex justify-between mt-6'>
            {step > 1 ? (
              <Button
                type='button'
                variant='outline'
                onClick={() => setStep(step - 1)}
                disabled={loading}
              >
                Back
              </Button>
            ) : (
              <span />
            )}
            {step < 4 ? (
              <Button
                type='button'
                onClick={() => setStep(step + 1)}
                disabled={
                  loading ||
                  (step === 1 && !fullName) ||
                  (step === 2 && (!barangay || !blkLot || !street)) ||
                  (step === 3 && (!idFile || !addressFile))
                }
              >
                Next
              </Button>
            ) : (
              <Button
                disabled={loading || !email || !password}
                type='submit'
                className='w-32'
              >
                {loading ? 'Creating account…' : 'Sign Up'}
              </Button>
            )}
          </div>

          {step === 4 && (
            <div className='text-center text-sm mt-2'>
              <span>Already have an account? </span>
              <button
                type='button'
                onClick={onSwitchToLogin}
                className='text-blue-600 hover:underline'
              >
                Log In
              </button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
