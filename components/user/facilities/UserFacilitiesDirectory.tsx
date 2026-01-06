'use client';

import { useState, useMemo, useEffect } from 'react';
import { Header } from '../UserHeader';
import { Input } from '../../ui/input';
import { Search, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import * as L from 'leaflet';
import Footer from '../../Footer';
import { useItems, useCategories } from '@/lib/hooks/useItems';
import { useAuth } from '@/lib/hooks/useAuth';

interface FacilityDirectoryProps {
  onNavigate: (
    view: 'dashboard' | 'services' | 'facilities' | 'application' | 'requests',
  ) => void;
  onSelectFacility: (facility: string) => void;
}

// Fix for Leaflet default icon in Next.js - moved to useEffect to avoid SSR issues

// Default coordinates for Bacoor, Cavite
const defaultLat = 14.41;
const defaultLng = 120.97;

export function FacilitiesDirectory({
  onSelectFacility,
}: FacilityDirectoryProps) {
  const { user } = useAuth();
  const barangayId = user?.barangayId ?? undefined;
  const { items: facilities, loading } = useItems('facility', barangayId);
  const { categories } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fix for Leaflet default icon in Next.js - only run on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    }
  }, []);

  const categoryOptions = useMemo(() => {
    const allOption = {
      id: 'all',
      label: 'All Facilities',
      count: facilities.length,
    };
    const categoryOptions = categories.map((cat) => ({
      id: cat.id,
      label: cat.name,
      count: facilities.filter((f) => {
        const categoryId = (f as any).categoryId || (f as any).category_id;
        return categoryId === cat.id;
      }).length,
    }));
    return [allOption, ...categoryOptions];
  }, [categories, facilities]);

  const filteredServices = useMemo(() => {
    return facilities.filter((facility) => {
      const matchesSearch =
        facility.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        false;
      const categoryId =
        (facility as any).categoryId || (facility as any).category_id;
      const matchesCategory =
        selectedCategory === 'all' || categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [facilities, searchTerm, selectedCategory]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>Loading facilities...</div>
      </div>
    );
  }

  return (
    <div>
      <div className='min-h-screen bg-gradient-to-b from-blue-50 to-gray-200 p-6 rounded-lg m-5'>
        <Header />

        <main className='max-w-7xl mx-auto px-4 py-8'>
          {/* MAP VIEW */}
          <h2 className='text-2xl mb-4 flex items-center font-semibold justify-center'>
            {' '}
            Barangay Facilities
          </h2>
          <div className='w-[75%] mx-auto h-[300px] rounded-2xl overflow-hidden shadow-xl mb-8 border-1 border-blue-600'>
            <MapContainer
              center={[defaultLat, defaultLng]}
              zoom={12}
              scrollWheelZoom={false}
              className='h-full w-full'
            >
              <TileLayer
                attribution='© OpenStreetMap contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              />

              {facilities.map((facility) => (
                <Marker key={facility.id} position={[defaultLat, defaultLng]}>
                  <Popup>{facility.name}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* FACILITIES - Search Box */}
          <div>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-semibold'>
                All Facilities ({filteredServices.length})
              </h2>
            </div>
            {/* Search + Category */}
            <div className='flex items-center gap-4 mb-6'>
              {/* Search */}
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4' />
                  <Input
                    type='text'
                    placeholder='Search facilities...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10 w-full bg-white'
                  />
                </div>
              </div>

              {/* Category */}
              <div className='w-150'>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className='bg-white'>
                    <SelectValue placeholder='Category' />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.label} ({category.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* FACILITIES - Card */}
          <div className='space-y-4 grid md:grid-cols-3 gap-4'>
            {filteredServices.map((facility) => {
              return (
                <div key={facility.id} className='w-full max-w-4xl'>
                  <Card
                    className='rounded-lg hover:shadow-lg transition-shadow cursor-pointer max-h-120px flex flex-col'
                    onClick={() => onSelectFacility(facility.id)}
                  >
                    <CardHeader className='pb-3'>
                      <div className='flex items-start gap-4'>
                        {/* Image on the left */}
                        {(facility as any).imageUrl ||
                        (facility as any).image_url ? (
                          <img
                            src={
                              (facility as any).imageUrl ||
                              (facility as any).image_url
                            }
                            alt={facility.name || 'Facility'}
                            className='w-48 h-36 object-cover rounded-lg border border-blue-800'
                          />
                        ) : (
                          <div className='w-48 h-36 bg-gray-200 rounded-lg border border-blue-800 flex items-center justify-center'>
                            <span className='text-gray-400'>No image</span>
                          </div>
                        )}

                        {/* Text content beside the image */}
                        <div className='flex flex-col justify-center text-left'>
                          <CardTitle className='text-lg font-bold mb-1'>
                            {facility.name}
                          </CardTitle>
                          <CardDescription className='text-sm text-gray-600'>
                            {facility.description || 'No description available'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className='pt-2'>
                      <div className='flex items-center justify-between space-x-3'>
                        {/* Availability Box */}
                        <div className='flex-1 flex items-center justify-center border border-gray-400 rounded-md px-3 py-2 text-sm text-black'>
                          <Clock className='h-4 w-4 mr-1' />
                          {facility.availability || 'N/A'}
                        </div>

                        {/* Status Box */}
                        <div className='flex-1 flex items-center justify-center border border-gray-400 rounded-md px-3 py-2 text-sm text-black'>
                          {facility.status}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {filteredServices.length === 0 && (
            <div className='text-center py-12'>
              <div className='text-gray-400 text-lg mb-2'>
                No services found
              </div>
              <p className='text-gray-600'>
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </main>
      </div>
      <div>
        {' '}
        <Footer />{' '}
      </div>
    </div>
  );
}
