import LocationExplorer from '@/components/location/LocationExplorer';

export const dynamic = 'force-dynamic';

export default function LocationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Explore Locations</h1>
          <p className="text-gray-600">Browse cities by job availability, arrangements, and salary stats</p>
        </div>
        <LocationExplorer />
      </div>
    </div>
  );
}


