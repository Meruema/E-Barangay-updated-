'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ManageBarangaysPage() {
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchBarangays() {
      setLoading(true);
      try {
        const res = await fetch('/api/barangays');
        const data = await res.json();
        setBarangays(data);
      } catch (e) {
        setBarangays([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBarangays();
  }, []);

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 flex flex-col items-center py-10 px-4'>
      <div className='w-full max-w-3xl bg-white/90 rounded-2xl shadow-xl p-8 border border-blue-100'>
        <h1 className='text-3xl font-extrabold text-blue-900 mb-6 tracking-tight'>
          Manage Barangays
        </h1>
        <Button className='mb-6' onClick={() => router.push('/super-admin')}>
          Back to Dashboard
        </Button>
        {loading ? (
          <div className='flex items-center gap-2 text-blue-600'>
            <span className='animate-spin h-5 w-5 border-b-2 border-blue-600 rounded-full inline-block'></span>{' '}
            Loading...
          </div>
        ) : (
          <ul className='divide-y divide-blue-100'>
            {barangays.length === 0 && (
              <li className='py-4 text-gray-500'>No barangays found.</li>
            )}
            {barangays.map((b: any) => (
              <li
                key={b.id}
                className='py-4 flex justify-between items-center group hover:bg-blue-50 transition rounded-lg px-2'
              >
                <span className='text-lg font-medium text-blue-900'>
                  {b.name}
                </span>
                <Button
                  size='sm'
                  className='bg-blue-100 text-blue-700 border border-blue-200 group-hover:bg-blue-200 group-hover:text-blue-900 transition'
                  onClick={() => router.push(`/super-admin/barangays/${b.id}`)}
                >
                  Edit
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
