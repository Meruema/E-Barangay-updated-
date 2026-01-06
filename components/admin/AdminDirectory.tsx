'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import {
  Search,
  Clock,
  Calendar,
  Trash,
  Edit,
  Plus,
  MapPin,
} from 'lucide-react';
import Footer from '../Footer';
import { useCategories } from '@/lib/hooks/useItems';
import { getItems, createItem, updateItem, deleteItem } from '@/lib/api/items';
import { getCurrentUser } from '@/app/actions/auth';
import type { ItemWithCategory } from '@/lib/database.types';

const CATEGORY_LIST = [
  'transport',
  'facility',
  'health',
  'security',
  'business',
  'travel',
  'permits',
  'social',
];

// small helper to convert file to base64 dataURL (used for preview & sending image_url)
async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AdminDirectory() {
  const { categories } = useCategories();
  const [items, setItems] = useState<ItemWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'alphabetical' | 'category'>(
    'alphabetical',
  );
  const [activeTab, setActiveTab] = useState<'services' | 'facilities'>(
    'services',
  );

  // Modals & form state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemWithCategory | null>(
    null,
  );
  const [processing, setProcessing] = useState(false);

  // form fields for create/edit
  const defaultForm = {
    name: '',
    description: '',
    category_id: '',
    type: '',
    availability: '',
    booking_rules: '',
    status: 'available',
    image_url: '', // URL from Supabase storage
  };
  const [form, setForm] = useState<any>(defaultForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch items, only for admin's barangay
  async function loadItems() {
    setLoading(true);
    try {
      let all = [];
      const user = await getCurrentUser();
      let type: 'service' | 'facility' | undefined = undefined;
      if (activeTab === 'services') type = 'service';
      if (activeTab === 'facilities') type = 'facility';
      if (user && user.role === 'ADMIN' && user.barangay && user.barangay.id) {
        all = await getItems(type, user.barangay.id);
      } else {
        all = await getItems(type);
      }
      setItems(all);
    } catch (err) {
      console.error('Failed to load items', err);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Derived filtered list
  const filteredItems = useMemo(() => {
    let filtered = items.filter((item) => {
      // item.type often used to denote processing time; keep all items for both tabs, but you can refine by item.type or item.category
      // We'll filter by category selection and search term
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (item.name || '').toLowerCase().includes(searchLower) ||
        (item.description || '').toLowerCase().includes(searchLower) ||
        (item.category?.name || '').toLowerCase().includes(searchLower);

      const itemCategoryId =
        (item as any).categoryId ||
        (item as any).category_id ||
        item.category?.id;
      const matchesCategory =
        selectedCategory === 'all' || itemCategoryId === selectedCategory;

      // filter by activeTab: services vs facilities
      const isFacility =
        (item.type || '').toLowerCase() === 'facility' ||
        (item.category?.name || '').toLowerCase() === 'facility' ||
        (item as any).type === 'facility';
      // to make tab meaningful: if activeTab === facilities, include items that have category === facility OR item.type === facility
      if (activeTab === 'facilities') {
        if (!isFacility) return false;
      } else {
        if (isFacility) return false;
      }

      return matchesSearch && matchesCategory;
    });

    // sort
    filtered.sort((a, b) => {
      if (sortBy === 'alphabetical')
        return (a.name || '').localeCompare(b.name || '');
      return (a.category?.name || '').localeCompare(b.category?.name || '');
    });

    return filtered;
  }, [items, searchTerm, selectedCategory, sortBy, activeTab]);

  // Open edit modal prefilled
  const openEdit = (item: ItemWithCategory) => {
    setSelectedItem(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      category_id:
        (item as any).categoryId ||
        (item as any).category_id ||
        item.category?.id ||
        '',
      type: (item as any).type || '',
      availability: (item as any).availability || '',
      booking_rules:
        (item as any).booking_rules || (item as any).bookingRules || '',
      status: (item as any).status || 'available',
      image_url: (item as any).image_url || (item as any).imageUrl || '',
    });
    setImagePreview((item as any).image_url || (item as any).imageUrl || null);
    setImageFile(null);
    setIsEditOpen(true);
  };

  const openAdd = () => {
    setSelectedItem(null);
    setForm(defaultForm);
    setImagePreview(null);
    setImageFile(null);
    setIsAddOpen(true);
  };

  const openDelete = (item: ItemWithCategory) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  // handle file input change (only for facility)
  const onImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const base64 = await fileToBase64(file);
      setImagePreview(base64);
      // we won't auto-insert to form.image_url until submit (so we can show preview)
    } else {
      setImagePreview(null);
    }
  };

  // Submit edit
  const handleSaveEdit = async () => {
    if (!selectedItem) return;

    // Validate required fields
    if (!form.name || form.name.trim() === '') {
      toast.error('Item name is required');
      return;
    }

    if (form.name.length < 3) {
      toast.error('Item name must be at least 3 characters long');
      return;
    }

    if (form.name.length > 200) {
      toast.error('Item name must not exceed 200 characters');
      return;
    }

    if (!form.description || form.description.trim() === '') {
      toast.error('Description is required');
      return;
    }

    if (form.description.length < 10) {
      toast.error('Description must be at least 10 characters long');
      return;
    }

    if (form.description.length > 1000) {
      toast.error('Description must not exceed 1000 characters');
      return;
    }

    if (!form.category_id) {
      toast.error('Please select a category');
      return;
    }

    if (!form.type || form.type.trim() === '') {
      toast.error('Processing time is required');
      return;
    }

    const validProcessingTimes = [
      'Same Day',
      '1 Day',
      '2 Days',
      '3 Days',
      '4 Days',
      '5 Days',
      '1 Week',
      '2 Weeks',
      '3 Weeks',
      '1 Month',
    ];
    if (!validProcessingTimes.includes(form.type)) {
      toast.error('Please select a valid processing time');
      return;
    }

    if (!form.availability || form.availability.trim() === '') {
      toast.error('Availability is required');
      return;
    }

    const validAvailability = [
      'Business Hours',
      '24/7',
      'Weekdays',
      'Weekends',
      'Holidays',
      'By Appointment',
      'Not Available',
    ];
    if (!validAvailability.includes(form.availability)) {
      toast.error('Please select a valid availability option');
      return;
    }

    if (form.booking_rules && form.booking_rules.length > 500) {
      toast.error('Booking rules must not exceed 500 characters');
      return;
    }

    if (!form.status) {
      toast.error('Status is required');
      return;
    }

    setProcessing(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        description: form.description.trim(),
        category_id: form.category_id,
        type: form.type.trim(),
        availability: form.availability.trim(),
        booking_rules: form.booking_rules?.trim() || '',
        status: form.status,
      };

      // if facility and image selected, upload to Supabase
      const categoryObj = categories?.find((c) => c.id === form.category_id);
      const categoryName = categoryObj?.name?.toLowerCase() || '';
      if (
        categoryName === 'facility' ||
        form.category_id === 'facility' ||
        form.category_id === 'Facility'
      ) {
        if (imageFile) {
          // Upload image to Supabase storage
          const formData = new FormData();
          formData.append('file', imageFile);

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            throw new Error('Failed to upload image');
          }

          const { url } = await uploadRes.json();
          payload.image_url = url;
        } else if (form.image_url) {
          payload.image_url = form.image_url;
        }
      }

      await updateItem(selectedItem.id, payload);
      toast.success('Item updated successfully');
      setIsEditOpen(false);
      await loadItems();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update item');
    } finally {
      setProcessing(false);
    }
  };

  // Submit add
  const handleCreate = async () => {
    // Validate required fields
    if (!form.name || form.name.trim() === '') {
      toast.error('Item name is required');
      return;
    }

    if (form.name.length < 3) {
      toast.error('Item name must be at least 3 characters long');
      return;
    }

    if (form.name.length > 200) {
      toast.error('Item name must not exceed 200 characters');
      return;
    }

    if (!form.description || form.description.trim() === '') {
      toast.error('Description is required');
      return;
    }

    if (form.description.length < 10) {
      toast.error('Description must be at least 10 characters long');
      return;
    }

    if (form.description.length > 1000) {
      toast.error('Description must not exceed 1000 characters');
      return;
    }

    if (!form.category_id) {
      toast.error('Please select a category');
      return;
    }

    if (!form.type || form.type.trim() === '') {
      toast.error('Processing time is required');
      return;
    }

    const validProcessingTimes = [
      'Same Day',
      '1 Day',
      '2 Days',
      '3 Days',
      '4 Days',
      '5 Days',
      '1 Week',
      '2 Weeks',
      '3 Weeks',
      '1 Month',
    ];
    if (!validProcessingTimes.includes(form.type)) {
      toast.error('Please select a valid processing time');
      return;
    }

    if (!form.availability || form.availability.trim() === '') {
      toast.error('Availability is required');
      return;
    }

    const validAvailability = [
      'Business Hours',
      '24/7',
      'Weekdays',
      'Weekends',
      'Holidays',
      'By Appointment',
      'Not Available',
    ];
    if (!validAvailability.includes(form.availability)) {
      toast.error('Please select a valid availability option');
      return;
    }

    if (form.booking_rules && form.booking_rules.length > 500) {
      toast.error('Booking rules must not exceed 500 characters');
      return;
    }

    if (!form.status) {
      toast.error('Status is required');
      return;
    }

    // Validate facility-specific requirements
    const categoryObj = categories?.find((c) => c.id === form.category_id);
    const categoryName = categoryObj?.name?.toLowerCase() || '';
    const isFacility =
      categoryName === 'facility' ||
      form.category_id === 'facility' ||
      form.category_id === 'Facility';

    if (isFacility && !imageFile && !form.image_url) {
      toast.error('An image is required for facilities');
      return;
    }

    setProcessing(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        description: form.description.trim(),
        category_id: form.category_id,
        type: form.type.trim(),
        availability: form.availability.trim(),
        booking_rules: form.booking_rules?.trim() || '',
        status: form.status,
      };

      if (isFacility) {
        if (imageFile) {
          // Upload image to Supabase storage
          const formData = new FormData();
          formData.append('file', imageFile);

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            throw new Error('Failed to upload image');
          }

          const { url } = await uploadRes.json();
          payload.image_url = url;
        } else if (form.image_url) {
          payload.image_url = form.image_url;
        }
      }

      await createItem(payload);
      toast.success('Item created successfully');
      setIsAddOpen(false);
      setForm(defaultForm);
      setImageFile(null);
      setImagePreview(null);
      await loadItems();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create item');
    } finally {
      setProcessing(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
      await deleteItem(selectedItem.id);
      toast.success('Item deleted');
      setIsDeleteOpen(false);
      await loadItems();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete item');
    } finally {
      setProcessing(false);
    }
  };

  // derive category options with counts for dropdown
  const categoryOptions = useMemo(() => {
    const base = [{ id: 'all', label: 'All', count: items.length }];
    const counts = CATEGORY_LIST.map((catKey) => {
      const count = items.filter((it) => {
        const catId =
          (it as any).categoryId || (it as any).category_id || it.category?.id;
        const catName = it.category?.name?.toLowerCase();
        // match either by id or by name
        return catId === catKey || catName === catKey;
      }).length;
      return {
        id: catKey,
        label: catKey.charAt(0).toUpperCase() + catKey.slice(1),
        count,
      };
    });
    return [...base, ...counts];
  }, [items]);

  return (
    <div className='min-h-screen bg-background'>
      <div className='min-h-screen bg-gradient-to-b from-blue-50 to-gray-200 p-6 rounded-lg m-5'>
        <div className='container mx-auto px-4 py-8'>
          <div className='mb-6 flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold mb-1'>
                Services & Facilities Directory (Admin)
              </h1>
              <p className='text-muted-foreground'>
                Edit, create, or delete services and facilities
              </p>
            </div>

            <div className='flex items-center gap-2'>
              <Button onClick={openAdd}>
                <Plus className='mr-2 h-4 w-4' />
                Add New Item
              </Button>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className='mb-6'
          >
            <TabsList>
              <TabsTrigger value='services'>Services</TabsTrigger>
              <TabsTrigger value='facilities'>Facilities</TabsTrigger>
            </TabsList>

            <TabsContent value='services' className='mt-6'>
              <div className='space-y-6'>
                <AnimatePresence mode='wait'>
                  {loading ? (
                    <motion.div
                      key='loading'
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className='flex flex-col items-center justify-center py-20'
                    >
                      <Image
                        src='/Loading Files.gif'
                        alt='Loading Files'
                        width={200}
                        height={200}
                        className='rounded-lg'
                        unoptimized
                      />
                      <p className='mt-4 text-gray-600 font-medium text-lg'>
                        Loading Services...
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key='content'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <>
                        <div className='flex items-center gap-4'>
                          <div className='flex-1 relative'>
                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4' />
                            <Input
                              type='text'
                              placeholder='Search items...'
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className='pl-10'
                            />
                          </div>

                          <Select
                            value={selectedCategory}
                            onValueChange={(v) => setSelectedCategory(v)}
                          >
                            <SelectTrigger className='w-48'>
                              <SelectValue placeholder='Category' />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.label} ({c.count})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={sortBy}
                            onValueChange={(v) => setSortBy(v as any)}
                          >
                            <SelectTrigger className='w-48'>
                              <SelectValue placeholder='Sort By' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='alphabetical'>A-Z</SelectItem>
                              <SelectItem value='category'>Category</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className='space-y-4'>
                          {filteredItems.map((item) => {
                            const itemNameLower = (
                              item.name || ''
                            ).toLowerCase();
                            return (
                              <Card
                                key={item.id}
                                className='hover:shadow-md transition-shadow'
                              >
                                <CardContent className='p-6'>
                                  <div className='flex items-start justify-between'>
                                    <div className='flex space-x-4 flex-1'>
                                      <div className='p-2 rounded-lg bg-gray-50'>
                                        <Clock className='h-8 w-8 text-blue-800' />
                                      </div>
                                      <div className='flex-1'>
                                        <h3 className='text-lg font-semibold mb-1'>
                                          {item.name}
                                        </h3>
                                        <p className='text-gray-600 mb-3'>
                                          {item.description}
                                        </p>
                                        <div className='flex items-center space-x-3'>
                                          <div className='flex items-center text-sm text-gray-700'>
                                            <Calendar className='h-4 w-4 mr-1 text-gray-500' />
                                            <span>{item.type || 'N/A'}</span>
                                          </div>
                                          {item.category && (
                                            <Badge variant='secondary'>
                                              {item.category.name}
                                            </Badge>
                                          )}
                                          <Badge
                                            variant={
                                              item.availability === '24/7'
                                                ? 'default'
                                                : 'secondary'
                                            }
                                          >
                                            {item.availability ||
                                              'Business hours'}
                                          </Badge>
                                          <Badge variant='outline'>
                                            {item.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>

                                    <div className='flex flex-col items-end justify-between ml-6 w-40'>
                                      <div className='flex space-x-2'>
                                        <Button
                                          variant='ghost'
                                          onClick={() => openEdit(item)}
                                        >
                                          <Edit className='h-4 w-4' />
                                        </Button>
                                        <Button
                                          variant='destructive'
                                          onClick={() => openDelete(item)}
                                        >
                                          <Trash className='h-4 w-4' />
                                        </Button>
                                      </div>

                                      <div className='text-sm text-right'>
                                        {((item as any).imageUrl ||
                                          (item as any).image_url) && (
                                          <img
                                            src={
                                              (item as any).imageUrl ||
                                              (item as any).image_url
                                            }
                                            alt={item.name}
                                            className='mt-2 w-24 h-14 object-cover rounded'
                                          />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>

                        {filteredItems.length === 0 && (
                          <div className='text-center py-12'>
                            <div className='text-gray-400 text-lg mb-2'>
                              No items found
                            </div>
                            <p className='text-gray-600'>
                              Try adjusting your search or filter criteria
                            </p>
                          </div>
                        )}
                      </>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>

            {/* Facilities Tab shows same list filtered by facility logic above */}
            <TabsContent value='facilities' className='mt-6'>
              {/* reuse the same UI since filtering is handled above */}
              <div className='space-y-6'>
                <AnimatePresence mode='wait'>
                  {loading ? (
                    <motion.div
                      key='loading'
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className='flex flex-col items-center justify-center py-20'
                    >
                      <Image
                        src='/Loading Files.gif'
                        alt='Loading Files'
                        width={200}
                        height={200}
                        className='rounded-lg'
                        unoptimized
                      />
                      <p className='mt-4 text-gray-600 font-medium text-lg'>
                        Loading Facilities...
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key='content'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <>
                        <div className='flex items-center gap-4'>
                          <div className='flex-1 relative'>
                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4' />
                            <Input
                              type='text'
                              placeholder='Search facilities...'
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className='pl-10'
                            />
                          </div>

                          <Select
                            value={selectedCategory}
                            onValueChange={(v) => setSelectedCategory(v)}
                          >
                            <SelectTrigger className='w-48'>
                              <SelectValue placeholder='Category' />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.label} ({c.count})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={sortBy}
                            onValueChange={(v) => setSortBy(v as any)}
                          >
                            <SelectTrigger className='w-48'>
                              <SelectValue placeholder='Sort By' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='alphabetical'>A-Z</SelectItem>
                              <SelectItem value='category'>Category</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className='space-y-4'>
                          {filteredItems.map((item) => (
                            <Card
                              key={item.id}
                              className='hover:shadow-md transition-shadow'
                            >
                              <CardContent className='p-4'>
                                <div className='flex items-start space-x-3'>
                                  <div className='p-2 rounded-lg bg-gray-50'>
                                    <MapPin className='h-8 w-8 text-blue-800' />
                                  </div>
                                  <div className='flex-1'>
                                    <h3 className='font-semibold mb-1'>
                                      {item.name}
                                    </h3>
                                    <p className='text-sm text-gray-600 mb-2'>
                                      {item.description}
                                    </p>
                                    {item.category && (
                                      <Badge
                                        variant='secondary'
                                        className='mt-2'
                                      >
                                        {item.category.name}
                                      </Badge>
                                    )}
                                  </div>

                                  <div className='flex flex-col items-end space-y-2'>
                                    <div className='flex space-x-2'>
                                      <Button
                                        variant='ghost'
                                        onClick={() => openEdit(item)}
                                      >
                                        <Edit className='h-4 w-4' />
                                      </Button>
                                      <Button
                                        variant='destructive'
                                        onClick={() => openDelete(item)}
                                      >
                                        <Trash className='h-4 w-4' />
                                      </Button>
                                    </div>
                                    {((item as any).imageUrl ||
                                      (item as any).image_url) && (
                                      <img
                                        src={
                                          (item as any).imageUrl ||
                                          (item as any).image_url
                                        }
                                        alt={item.name}
                                        className='w-28 h-16 object-cover rounded'
                                      />
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={form.category_id}
                onValueChange={(v) => setForm({ ...form, category_id: v })}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label>Processing Time</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select processing time' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Same Day'>Same Day</SelectItem>
                    <SelectItem value='1 Day'>1 Day</SelectItem>
                    <SelectItem value='2 Days'>2 Days</SelectItem>
                    <SelectItem value='3 Days'>3 Days</SelectItem>
                    <SelectItem value='4 Days'>4 Days</SelectItem>
                    <SelectItem value='5 Days'>5 Days</SelectItem>
                    <SelectItem value='1 Week'>1 Week</SelectItem>
                    <SelectItem value='2 Weeks'>2 Weeks</SelectItem>
                    <SelectItem value='3 Weeks'>3 Weeks</SelectItem>
                    <SelectItem value='1 Month'>1 Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Availability</Label>
                <Select
                  value={form.availability}
                  onValueChange={(v) => setForm({ ...form, availability: v })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select availability' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Business Hours'>
                      Business Hours
                    </SelectItem>
                    <SelectItem value='24/7'>24/7</SelectItem>
                    <SelectItem value='Weekdays'>Weekdays</SelectItem>
                    <SelectItem value='Weekends'>Weekends</SelectItem>
                    <SelectItem value='Holidays'>Holidays</SelectItem>
                    <SelectItem value='By Appointment'>
                      By Appointment
                    </SelectItem>
                    <SelectItem value='Not Available'>Not Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Booking Rules</Label>
              <Textarea
                value={form.booking_rules}
                onChange={(e) =>
                  setForm({ ...form, booking_rules: e.target.value })
                }
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='available'>available</SelectItem>
                    <SelectItem value='unavailable'>unavailable</SelectItem>
                    <SelectItem value='maintenance'>maintenance</SelectItem>
                    <SelectItem value='archived'>archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Show image upload for facilities */}
            {(form.category_id === 'facility' ||
              categories
                ?.find((c) => c.id === form.category_id)
                ?.name?.toLowerCase() === 'facility') && (
              <div>
                <Label>Image (Facility)</Label>
                <Input type='file' accept='image/*' onChange={onImageChange} />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt='preview'
                    className='mt-2 w-40 h-28 object-cover rounded'
                  />
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={processing}>
              {processing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={form.category_id}
                onValueChange={(v) => setForm({ ...form, category_id: v })}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label>Processing Time</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select processing time' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Same Day'>Same Day</SelectItem>
                    <SelectItem value='1 Day'>1 Day</SelectItem>
                    <SelectItem value='2 Days'>2 Days</SelectItem>
                    <SelectItem value='3 Days'>3 Days</SelectItem>
                    <SelectItem value='4 Days'>4 Days</SelectItem>
                    <SelectItem value='5 Days'>5 Days</SelectItem>
                    <SelectItem value='1 Week'>1 Week</SelectItem>
                    <SelectItem value='2 Weeks'>2 Weeks</SelectItem>
                    <SelectItem value='3 Weeks'>3 Weeks</SelectItem>
                    <SelectItem value='1 Month'>1 Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Availability</Label>
                <Select
                  value={form.availability}
                  onValueChange={(v) => setForm({ ...form, availability: v })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select availability' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Business Hours'>
                      Business Hours
                    </SelectItem>
                    <SelectItem value='24/7'>24/7</SelectItem>
                    <SelectItem value='Weekdays'>Weekdays</SelectItem>
                    <SelectItem value='Weekends'>Weekends</SelectItem>
                    <SelectItem value='Holidays'>Holidays</SelectItem>
                    <SelectItem value='By Appointment'>
                      By Appointment
                    </SelectItem>
                    <SelectItem value='Not Available'>Not Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Booking Rules</Label>
              <Textarea
                value={form.booking_rules}
                onChange={(e) =>
                  setForm({ ...form, booking_rules: e.target.value })
                }
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='available'>available</SelectItem>
                    <SelectItem value='unavailable'>unavailable</SelectItem>
                    <SelectItem value='maintenance'>maintenance</SelectItem>
                    <SelectItem value='archived'>archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(form.category_id === 'facility' ||
              categories
                ?.find((c) => c.id === form.category_id)
                ?.name?.toLowerCase() === 'facility') && (
              <div>
                <Label>Image (Facility)</Label>
                <Input type='file' accept='image/*' onChange={onImageChange} />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt='preview'
                    className='mt-2 w-40 h-28 object-cover rounded'
                  />
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsAddOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={processing}>
              {processing ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
          </DialogHeader>
          <div>
            Are you sure you want to delete{' '}
            <strong>{selectedItem?.name}</strong>? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDeleteOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={processing}
            >
              {processing ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
