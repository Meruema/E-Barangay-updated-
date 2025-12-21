'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Landmark, Menu } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

type Barangay = {
  id: number | string;
  name: string;
};

export default function SuperAdminPage() {
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBarangay, setNewBarangay] = useState('');
  const [adding, setAdding] = useState(false);
  const [editModal, setEditModal] = useState<{
    open: boolean;
    id: string | number | null;
    name: string;
  }>({
    open: false,
    id: null,
    name: '',
  });
  const [removeModal, setRemoveModal] = useState<{
    open: boolean;
    id: string | number | null;
    confirm: string;
  }>({
    open: false,
    id: null,
    confirm: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
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

  async function handleAddBarangay(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newBarangay.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/barangays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBarangay.trim() }),
      });
      if (res.status === 200) {
        toast.success('Barangay added!');
        setNewBarangay('');
        const data = await res.json();
        setBarangays((prev) => [...prev, data as Barangay]);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to add barangay.');
      }
    } catch {
      toast.error('Failed to add barangay.');
    } finally {
      setAdding(false);
    }
  }

  function openEditModal(id: Barangay['id'], name: string) {
    setEditModal({ open: true, id, name });
  }

  async function handleEditBarangay() {
    if (!editModal.id || !editModal.name.trim()) return;
    setEditLoading(true);
    try {
      const res = await fetch('/api/barangays', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editModal.id, name: editModal.name.trim() }),
      });
      if (res.status === 200) {
        setBarangays((prev) =>
          prev.map((b) =>
            b.id === editModal.id ? { ...b, name: editModal.name.trim() } : b,
          ),
        );
        toast.success('Barangay updated!');
        setEditModal({ open: false, id: null, name: '' });
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to update barangay.');
      }
    } catch {
      toast.error('Failed to update barangay.');
    } finally {
      setEditLoading(false);
    }
  }

  function openRemoveModal(id: Barangay['id']) {
    setRemoveModal({ open: true, id, confirm: '' });
  }

  async function handleRemoveBarangayModal() {
    if (!removeModal.id || removeModal.confirm !== 'delete') return;
    setRemoveLoading(true);
    try {
      const res = await fetch('/api/barangays', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: removeModal.id }),
      });
      if (res.status === 200) {
        setBarangays((prev) => prev.filter((b) => b.id !== removeModal.id));
        toast.success('Barangay removed.');
        setRemoveModal({ open: false, id: null, confirm: '' });
      } else {
        toast.error('Failed to remove barangay.');
      }
    } catch {
      toast.error('Failed to remove barangay.');
    } finally {
      setRemoveLoading(false);
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 flex flex-col items-center justify-start py-10 px-4'>
      <div className='w-full max-w-4xl'>
        {/* Copied AdminHeader style */}
        <div className='max-w-4xl mx-auto px-6 mb-8'>
          <div className='flex items-center justify-between rounded-full bg-white px-6 py-3 shadow-sm'>
            <div className='flex items-center space-x-3 cursor-pointer'>
              <Landmark className='h-8 w-8 text-blue-800' />
              <h1 className='text-xl font-semibold text-gray-900'>
                E-Barangay Super Admin
              </h1>
            </div>
            <nav className='flex items-center space-x-8 text-sm font-medium text-gray-700'>
              <button
                onClick={() => router.push('/super-admin')}
                className='hover:text-blue-600'
              >
                Barangays
              </button>
              <button
                onClick={() => router.push('/super-admin/users')}
                className='hover:text-blue-600'
              >
                Users & Admins
              </button>
            </nav>
            <div className='flex items-center space-x-3'>
              <Button variant='outline'>
                <Menu className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
        <div className='bg-white/80 rounded-xl shadow-lg p-6 border border-blue-50'>
          <h2 className='text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2'>
            <svg
              className='w-6 h-6 text-blue-500'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4m-5 4h18'
              />
            </svg>
            Barangay List
          </h2>
          <form
            onSubmit={handleAddBarangay}
            className='flex flex-col gap-1 mb-6'
          >
            <div className='flex gap-2 items-end'>
              <input
                className='border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1'
                type='text'
                placeholder='Add new barangay...'
                value={newBarangay}
                onChange={(e) => setNewBarangay(e.target.value.slice(0, 20))}
                disabled={adding}
                maxLength={20}
                required
              />
              <Button
                type='submit'
                className='bg-blue-600 text-white px-4 py-2 rounded-lg'
                disabled={adding}
              >
                {adding ? 'Adding...' : 'Add'}
              </Button>
            </div>
            <div className='text-xs text-right text-blue-700 pr-1'>
              {newBarangay.length} / 20
            </div>
          </form>
          {loading ? (
            <div className='flex items-center gap-2 text-blue-600'>
              <span className='animate-spin h-5 w-5 border-b-2 border-blue-600 rounded-full inline-block'></span>{' '}
              Loading...
            </div>
          ) : (
            <Table className='bg-white rounded-lg border border-blue-100 shadow-sm'>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-1/12'>#</TableHead>
                  <TableHead className='w-7/12'>Barangay Name</TableHead>
                  <TableHead className='w-4/12 text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {barangays.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className='text-center text-gray-500 py-6'
                    >
                      No barangays found.
                    </TableCell>
                  </TableRow>
                ) : (
                  barangays.map((b, idx) => (
                    <TableRow key={b.id}>
                      <TableCell className='font-semibold text-blue-700'>
                        {idx + 1}
                      </TableCell>
                      <TableCell className='text-lg text-blue-900'>
                        {b.name}
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          size='sm'
                          className='bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 hover:text-blue-900 transition mr-2'
                          onClick={() => openEditModal(b.id, b.name)}
                        >
                          Edit
                        </Button>
                        <Button
                          size='sm'
                          variant='destructive'
                          onClick={() => openRemoveModal(b.id)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {/* Edit Barangay Modal */}
          <Dialog
            open={editModal.open}
            onOpenChange={(open) =>
              setEditModal(
                open ? editModal : { open: false, id: null, name: '' },
              )
            }
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Barangay</DialogTitle>
              </DialogHeader>
              <Input
                value={editModal.name}
                onChange={(e) =>
                  setEditModal({ ...editModal, name: e.target.value })
                }
                placeholder='Barangay name'
                disabled={editLoading}
                maxLength={50}
                required
              />
              <DialogFooter>
                <Button
                  onClick={handleEditBarangay}
                  disabled={editLoading}
                  className='bg-blue-100'
                >
                  <span className='text-blue-600'>
                    {editLoading ? 'Saving...' : 'Save'}
                  </span>
                </Button>
                <Button
                  variant='outline'
                  onClick={() =>
                    setEditModal({ open: false, id: null, name: '' })
                  }
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Remove Barangay Modal */}
          <Dialog
            open={removeModal.open}
            onOpenChange={(open) =>
              setRemoveModal(
                open ? removeModal : { open: false, id: null, confirm: '' },
              )
            }
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Barangay</DialogTitle>
              </DialogHeader>
              <div className='mb-2'>
                Type <b>delete</b> to confirm removal.
              </div>
              <Input
                value={removeModal.confirm}
                onChange={(e) =>
                  setRemoveModal({ ...removeModal, confirm: e.target.value })
                }
                placeholder="Type 'delete' to confirm"
                disabled={removeLoading}
              />
              <DialogFooter>
                <Button
                  onClick={handleRemoveBarangayModal}
                  disabled={removeLoading || removeModal.confirm !== 'delete'}
                  variant='destructive'
                >
                  {removeLoading ? 'Removing...' : 'Remove'}
                </Button>
                <Button
                  variant='outline'
                  onClick={() =>
                    setRemoveModal({ open: false, id: null, confirm: '' })
                  }
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
