'use client';
import { ServiceDirectory } from '@/components/user/services/UserServiceDirectory';
import { useItems, useCategories } from '@/lib/hooks/useItems';
import { useAuth } from '@/lib/hooks/useAuth';
import AnimatedLoader from '@/components/AnimatedLoader';

export default function ServicesPage() {
  const { user } = useAuth();
  const barangayId = user?.barangayId ?? undefined;
  const { items: services, loading: servicesLoading } = useItems(
    'service',
    barangayId,
  );
  const { categories, loading: categoriesLoading } = useCategories();

  if (servicesLoading || categoriesLoading) {
    return <AnimatedLoader message='Loading Services...' />;
  }

  return (
    <ServiceDirectory
      onNavigate={() => {}}
      onSelectService={() => {}}
      services={services}
      categories={categories}
    />
  );
}
