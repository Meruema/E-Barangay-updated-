'use client';

import { SharedHeader } from '@/components/SharedHeader';
import { AdminDirectory } from '@/components/admin/AdminDirectory';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getItems } from '@/lib/api/items';
import { useCategories } from '@/lib/hooks/useItems';
import AnimatedLoader from '@/components/AnimatedLoader';

export default function AdminDirectoryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const { categories, loading: categoriesLoading } = useCategories();

  useEffect(() => {
    async function loadItems() {
      if (!user) return;

      setLoading(true);
      try {
        let allItems = [];
        if (user.barangayId) {
          allItems = await getItems(undefined, user.barangayId);
        } else {
          allItems = await getItems();
        }
        setItems(allItems);
      } catch (err) {
        console.error('Failed to load items', err);
      } finally {
        setLoading(false);
      }
    }
    loadItems();
  }, [user]);

  if (loading || categoriesLoading) {
    return <AnimatedLoader message='Loading Directory...' />;
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-gray-200'>
      <div className='py-6'>
        <SharedHeader />
      </div>
      <AdminDirectory
        items={items}
        categories={categories}
        onItemsChange={setItems}
      />
    </div>
  );
}
