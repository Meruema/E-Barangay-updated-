'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { SharedHeader } from '@/components/SharedHeader';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { toast } from 'sonner';

type User = {
  id: string | number;
  fullName: string;
  blkLot?: string;
  street?: string;
  email?: string;
  role: string;
  barangay?: { name: string } | null;
  verified?: boolean;
};

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'USER';

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
} from '@/components/ui/sheet';

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('__ALL__');
  const [pendingBarangayFilter, setPendingBarangayFilter] = useState('__ALL__');
  const [sheetOpen, setSheetOpen] = useState(false);
  // const router = useRouterWithProgress();

  // Get current user info
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { user: currentUser } = require('@/lib/hooks/useAuth').useAuth();

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const res = await fetch('/api/users');
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

  // Keep pendingBarangayFilter in sync when opening the sheet
  useEffect(() => {
    if (sheetOpen) {
      setPendingBarangayFilter(barangayFilter);
    }
  }, [sheetOpen, barangayFilter]);

  // Get unique barangay names for filter
  const barangayOptions = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.barangay?.name) set.add(u.barangay.name);
    });
    return Array.from(set).sort();
  }, [users]);

  // Filtered users by search and barangay
  const filteredUsers = useMemo(() => {
    let filtered = users;
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(s) ||
          u.blkLot?.toLowerCase().includes(s) ||
          u.street?.toLowerCase().includes(s) ||
          u.email?.toLowerCase().includes(s) ||
          u.role?.toLowerCase().includes(s) ||
          (u.barangay?.name?.toLowerCase().includes(s) ?? false),
      );
    }
    if (barangayFilter !== '__ALL__') {
      filtered = filtered.filter((u) => u.barangay?.name === barangayFilter);
    }
    return filtered;
  }, [users, search, barangayFilter]);

  // TanStack Table columns
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        header: '#',
        cell: ({ row }) => row.index + 1,
      },
      {
        accessorKey: 'fullName',
        header: 'Full Name',
        cell: (info) => (
          <span className='font-medium text-blue-900'>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        id: 'address',
        header: 'Address',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <span className='text-blue-900'>
              {user.blkLot || ''} {user.street || ''}
            </span>
          );
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: (info) => (
          <span className='text-blue-700'>{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'barangay',
        header: 'Barangay',
        cell: (info) => (
          <span className='text-blue-900'>
            {info.row.original.barangay?.name || (
              <span className='italic text-gray-400'>None</span>
            )}
          </span>
        ),
        sortingFn: (a, b) => {
          const aName = a.original.barangay?.name || '';
          const bName = b.original.barangay?.name || '';
          return aName.localeCompare(bName);
        },
        enableSorting: true,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const user = row.original;
          const roleOptions: Role[] = ['SUPER_ADMIN', 'ADMIN', 'USER'];
          // Prevent current super admin from demoting themselves
          const isSelf = currentUser && user.id === currentUser.id;
          return (
            <Select
              value={user.role}
              onValueChange={async (newRole) => {
                setUpdating(user.id.toString());
                try {
                  const res = await fetch('/api/users', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: user.id, role: newRole }),
                  });
                  if (res.ok) {
                    setUsers((prev) =>
                      prev.map((u) =>
                        u.id === user.id ? { ...u, role: newRole } : u,
                      ),
                    );
                  }
                } finally {
                  setUpdating(null);
                }
              }}
              disabled={updating === user.id.toString() || isSelf}
            >
              <SelectTrigger className='w-32'>
                <SelectValue placeholder='Role' />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem
                    key={role}
                    value={role}
                    disabled={
                      (user.role === 'SUPER_ADMIN' &&
                        role !== 'SUPER_ADMIN' &&
                        updating === user.id.toString()) ||
                      (isSelf && role !== 'SUPER_ADMIN')
                    }
                  >
                    {role.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const user = row.original;
          const canVerify = user.role === 'USER' && !user.verified;
          return canVerify ? (
            <Button
              size='sm'
              variant='outline'
              className='border-green-400 text-green-700 hover:bg-green-100 hover:text-green-900 transition'
              disabled={updating === user.id.toString()}
              onClick={async () => {
                setUpdating(user.id.toString());
                try {
                  const res = await fetch('/api/users', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: user.id, verified: true }),
                  });
                  if (res.ok) {
                    setUsers((prev) =>
                      prev.map((u) =>
                        u.id === user.id ? { ...u, verified: true } : u,
                      ),
                    );
                    toast.success('User verified successfully!');
                  }
                } finally {
                  setUpdating(null);
                }
              }}
            >
              Verify
            </Button>
          ) : null;
        },
      },
    ],
    [ updating],
  );

  const table = useReactTable({
    data: filteredUsers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 flex flex-col items-center py-10 px-4'>
      <div className='w-full max-w-7xl'>
        <SharedHeader />
        <div className='w-full max-w-7xl bg-white/90 rounded-2xl shadow-xl p-8 border border-blue-100'>
          {/* Table Header with Search and Filter Sheet */}
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4'>
            <div className='flex-1'>
              <input
                type='text'
                className='w-full border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
                placeholder='Search users by name, address, email, role, or barangay...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className='flex items-center gap-2'>
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant='outline'
                    className='font-medium text-blue-900'
                  >
                    {barangayFilter !== '__ALL__'
                      ? `Filter: ${barangayFilter}`
                      : 'Filters'}
                  </Button>
                </SheetTrigger>
                <SheetContent side='right'>
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className='flex flex-col gap-4 p-4'>
                    <label className='font-medium text-blue-900 mb-1'>
                      Barangay
                    </label>
                    <Select
                      value={pendingBarangayFilter}
                      onValueChange={setPendingBarangayFilter}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='All Barangays' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='__ALL__'>All Barangays</SelectItem>
                        {barangayOptions.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <SheetFooter>
                    <Button
                      onClick={() => {
                        setBarangayFilter(pendingBarangayFilter);
                        setSheetOpen(false);
                      }}
                      className='w-full'
                    >
                      Apply
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          {loading ? (
            <div className='flex items-center gap-2 text-blue-600'>
              <span className='animate-spin h-5 w-5 border-b-2 border-blue-600 rounded-full inline-block'></span>{' '}
              Loading...
            </div>
          ) : (
            <div className='relative'>
              <div className='overflow-auto' style={{ maxHeight: '70vh' }}>
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className='text-blue-900'>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className='text-center text-gray-500 py-6'
                        >
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination Controls */}
              <div className='flex justify-between items-center mt-4'>
                <div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className='ml-2'
                  >
                    Next
                  </Button>
                </div>
                <div className='text-sm text-gray-600'>
                  Page {table.getState().pagination.pageIndex + 1} of{' '}
                  {table.getPageCount()}
                </div>
                <div>
                  <select
                    className='border rounded px-2 py-1 text-sm'
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => {
                      table.setPageSize(Number(e.target.value));
                    }}
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        Show {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
