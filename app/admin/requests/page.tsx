'use client';

import { SharedHeader } from '@/components/SharedHeader';
import { AdminRequestManagement } from '@/components/admin/AdminRequestManagement';

export default function AdminRequestsPage() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-gray-200'>
      <div className='py-6'>
        <SharedHeader />
      </div>
      <AdminRequestManagement />
    </div>
  );
}
