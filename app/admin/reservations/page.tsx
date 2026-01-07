'use client';

import { SharedHeader } from '@/components/SharedHeader';
import { AdminReservationManagement } from '@/components/admin/AdminReservationManagement';

export default function AdminReservationsPage() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-gray-200'>
      <div className='py-6'>
        <SharedHeader />
      </div>
      <AdminReservationManagement />
    </div>
  );
}
