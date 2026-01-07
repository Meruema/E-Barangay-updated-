'use client';
import { MainDashboard } from '@/components/user/UserMainDashboard';
import { UserServiceDirectory } from '@/components/user/services/UserServiceDirectory';
import { FacilitiesDirectory as UserFacilitiesDirectory } from '@/components/user/facilities/UserFacilitiesDirectory';
import { useItems, useCategories } from '@/lib/hooks/useItems';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserRequests } from '@/lib/api/requests';
import AnimatedLoader from '@/components/AnimatedLoader';
import { useState, useEffect } from 'react';

export default function UserPage() {
  const { user } = useAuth();
  const barangayId = user?.barangayId ?? undefined;
  const { items: services, loading: servicesLoading } = useItems(
    'service',
    barangayId,
  );
  const { items: facilities, loading: facilitiesLoading } = useItems(
    'facility',
    barangayId,
  );
  const { categories, loading: categoriesLoading } = useCategories();

  const [currentView, setCurrentView] = useState<
    'dashboard' | 'services' | 'facilities' | 'application' | 'requests'
  >('dashboard');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      if (!user) return;
      try {
        setRequestsLoading(true);
        const userRequests = await getUserRequests(user.id);
        setRequests(userRequests);
      } catch (error) {
        console.error('Failed to load requests:', error);
      } finally {
        setRequestsLoading(false);
      }
    }
    loadRequests();
  }, [user]);

  if (servicesLoading || facilitiesLoading || categoriesLoading || requestsLoading) {
    return <AnimatedLoader message='Loading User Dashboard...' />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <MainDashboard
            onNavigate={setCurrentView}
            onSelectService={(service) => {
              setSelectedService(service);
              setCurrentView('application');
            }}
            services={services}
            facilities={facilities}
            categories={categories}
            requests={requests}
            onRequestsChange={setRequests}
          />
        );
      case 'facilities':
        return (
          <UserFacilitiesDirectory
            onNavigate={setCurrentView}
            onSelectFacility={() => {}}
            facilities={facilities}
            categories={categories}
          />
        );
      default:
        return (
          <MainDashboard
            onNavigate={setCurrentView}
            services={services}
            facilities={facilities}
            categories={categories}
          />
        );
    }
  };

  return <div className='min-h-screen bg-background'>{renderView()}</div>;
}
