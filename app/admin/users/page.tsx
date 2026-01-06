'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { Header } from '@/components/admin/AdminHeader';

// User type for table
interface User {
  id: string;
  fullName: string;
  blkLot?: string;
  street?: string;
  email?: string;
  verified: boolean;
  barangay?: { name: string } | null;
  idUrl?: string;
  addressUrl?: string;
}

export default function AdminVerifyUsersPage() {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const admin = await getCurrentUser();
        if (!admin || admin.role !== 'ADMIN' || !admin.barangay?.id) {
          toast.error('Unauthorized or missing barangay.');
          setUsers([]);
          setLoading(false);
          return;
        }
        // Fetch only users in admin's barangay
        const res = await fetch(`/api/users?barangayId=${admin.barangay.id}`);
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleVerify = async (userId: string) => {
    setUpdating(userId);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, verified: true }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, verified: true } : u)),
        );
        toast.success('User verified successfully!');
      } else {
        toast.error('Failed to verify user.');
      }
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 flex flex-col items-center py-10 px-4'>
      <Header onNavigate={() => {}} />
      <div className='w-full'>
        <h1 className='text-2xl font-bold mb-6 text-center pt-6 pb-5'>
          Verify Users in Your Barangay
        </h1>
        <div className='w-[98vw] overflow-x-auto rounded-lg bg-white shadow p-4'>
          {loading ? (
            <div className='text-center py-10'>Loading...</div>
          ) : (
            <Table className='min-w-full'>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Barangay</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='text-center'>
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, idx) => (
                    <>
                      <TableRow key={user.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{user.fullName}</TableCell>
                        <TableCell>
                          {user.blkLot} {user.street}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.barangay?.name || (
                            <span className='italic text-gray-400'>None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.idUrl || user.addressUrl ? (
                            <Button
                              size='sm'
                              variant='outline'
                              className='border-blue-400 text-blue-700 hover:bg-blue-100 hover:text-blue-900 transition'
                              onClick={() =>
                                setExpandedUserId(
                                  expandedUserId === user.id ? null : user.id,
                                )
                              }
                            >
                              {expandedUserId === user.id ? 'Hide' : 'Show'}{' '}
                              Documents
                            </Button>
                          ) : (
                            <span className='text-gray-400'>No documents</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.verified ? (
                            <span className='text-green-600 font-semibold'>
                              Verified
                            </span>
                          ) : (
                            <span className='text-yellow-600 font-semibold'>
                              Unverified
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {!user.verified && (
                            <Button
                              size='sm'
                              variant='outline'
                              className='border-green-400 text-green-700 hover:bg-green-100 hover:text-green-900 transition'
                              disabled={updating === user.id}
                              onClick={() => handleVerify(user.id)}
                            >
                              Verify
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedUserId === user.id && (
                        <TableRow>
                          <TableCell colSpan={8} className='bg-blue-50 p-4'>
                            <div className='flex flex-col gap-4'>
                              {user.idUrl && (
                                <div>
                                  <span className='font-semibold'>
                                    Valid ID:
                                  </span>{' '}
                                  {user.idUrl.endsWith('.pdf') ? (
                                    <a
                                      href={user.idUrl}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className='text-blue-600 underline'
                                    >
                                      View PDF
                                    </a>
                                  ) : (
                                    <img
                                      src={user.idUrl}
                                      alt='Valid ID'
                                      className='max-h-40 rounded border shadow mt-2'
                                    />
                                  )}
                                </div>
                              )}
                              {user.addressUrl && (
                                <div>
                                  <span className='font-semibold'>
                                    Proof of Address:
                                  </span>{' '}
                                  {user.addressUrl.endsWith('.pdf') ? (
                                    <a
                                      href={user.addressUrl}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className='text-blue-600 underline'
                                    >
                                      View PDF
                                    </a>
                                  ) : (
                                    <img
                                      src={user.addressUrl}
                                      alt='Proof of Address'
                                      className='max-h-40 rounded border shadow mt-2'
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
