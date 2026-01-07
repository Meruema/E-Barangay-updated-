'use client';
import dynamic from 'next/dynamic';
import { useItems, useCategories } from '@/lib/hooks/useItems';
import { useAuth } from '@/lib/hooks/useAuth';
import AnimatedLoader from '@/components/AnimatedLoader';

const FacilitiesDirectory = dynamic(
  () =>
    import('@/components/user/facilities/UserFacilitiesDirectory').then(
      (mod) => mod.FacilitiesDirectory,
    ),
  { ssr: false },
);

export default function FacilitiesPage() {
  const { user } = useAuth();
  const barangayId = user?.barangayId ?? undefined;
  const { items: facilities, loading: facilitiesLoading } = useItems(
    'facility',
    barangayId,
  );
  const { categories, loading: categoriesLoading } = useCategories();

  if (facilitiesLoading || categoriesLoading) {
    return <AnimatedLoader message='Loading Facilities...' />;
  }

  return (
    <FacilitiesDirectory
      onNavigate={() => {}}
      onSelectFacility={() => {}}
      facilities={facilities}
      categories={categories}
    />
  );
}
