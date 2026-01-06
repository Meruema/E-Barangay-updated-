'use client';

import { SharedHeader } from '@/components/SharedHeader';
import { AdminDirectory } from '@/components/admin/AdminDirectory';

export default function AdminDirectoryPage() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-gray-200'>
      <div className='py-6'>
        <SharedHeader />
      </div>
      <AdminDirectory />
    </div>
  );
}
