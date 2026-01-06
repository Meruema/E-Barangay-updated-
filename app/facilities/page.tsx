'use client';
import dynamic from 'next/dynamic';

const FacilitiesDirectory = dynamic(
  () =>
    import('@/components/user/facilities/UserFacilitiesDirectory').then(
      (mod) => mod.FacilitiesDirectory,
    ),
  { ssr: false },
);

export default function FacilitiesPage() {
  return (
    <FacilitiesDirectory onNavigate={() => {}} onSelectFacility={() => {}} />
  );
}
