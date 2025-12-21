'use client';

import { useState, useEffect } from 'react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [barangays, setBarangays] = useState<{ id: string; name: string }[]>(
    [],
  );
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
    setLoading(true);

    try {
      const result = await signUp(email, password, username, barangay);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Account created successfully!');
        onOpenChange(false);

        setEmail('');
        setPassword('');
        setUsername('');
        if (barangays.length > 0) setBarangay(barangays[0].id);
      }
    } catch {
      toast.error('An error occurred. Please try again.');
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

        <form onSubmit={handleSubmit} className='space-y-4'>
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

          <div className='space-y-2'>
            <Label htmlFor='username'>Username</Label>
            <Input
              id='username'
              type='text'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              placeholder='johndoe'
            />
          </div>

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

          <Button disabled={loading} type='submit' className='w-full'>
            {loading ? 'Creating account…' : 'Sign Up'}
          </Button>

          <div className='text-center text-sm'>
            <span>Already have an account? </span>
            <button
              type='button'
              onClick={onSwitchToLogin}
              className='text-blue-600 hover:underline'
            >
              Log In
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
