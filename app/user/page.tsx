'use client';
import { MainDashboard } from '@/components/user/UserMainDashboard';
import { useState } from 'react';

export default function UserPage() {
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'services' | 'facilities' | 'application' | 'requests'
  >('dashboard');
  const [selectedService, setSelectedService] = useState<string | null>(null);

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
          />
        );
      // ...other cases for services, facilities, application, requests
      default:
        return <MainDashboard onNavigate={setCurrentView} />;
    }
  };

  return <div className='min-h-screen bg-background'>{renderView()}</div>;
}
