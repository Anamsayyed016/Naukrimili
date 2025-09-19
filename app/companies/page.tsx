'use client';

import { useState, useEffect } from 'react';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 Component mounted, starting fetch...');
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    console.log('🔍 Starting to fetch companies...');
    try {
      const response = await fetch('/api/companies/public');
      console.log('🌐 API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🌐 Response data:', data);
        
        if (data.success) {
          console.log('🔍 Setting companies:', data.data);
          setCompanies(data.data || []);
        } else {
          console.error('API returned error:', data.error);
          setError(data.error || 'Unknown error');
        }
      } else {
        console.error('API request failed:', response.status, response.statusText);
        setError(`API request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      console.log('✅ Setting loading to false');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading companies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchCompanies}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
        Companies ({companies.length})
      </h1>
      
      <div className="space-y-4">
        {companies.map((company) => (
          <div key={company.id} className="p-4 border rounded-lg">
            <h3 className="text-xl font-semibold">{company.name}</h3>
            <p className="text-gray-600">{company.description}</p>
            <p className="text-sm text-blue-600">
              {company._count?.jobs || 0} jobs available
            </p>
          </div>
        ))}
      </div>
      
      {companies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No companies found</p>
        </div>
      )}
    </div>
  );
}
