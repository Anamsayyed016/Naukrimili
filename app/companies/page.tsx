'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Company { id: number|string; name: string; location?: string; logo?: string|null; industry?: string }

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/companies');
        const data = await res.json();
        const list: Company[] = Array.isArray(data) ? data : data?.companies || [];
        setCompanies(list);
      } catch (e: any) {
        setError(e?.message || 'Failed to load companies');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Top Companies</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((c) => (
          <Link key={c.id} href={`/companies/${c.id}`} className="border rounded p-4 hover:shadow">
            <div className="flex items-center gap-3">
              {c.logo ? <img src={c.logo} alt={c.name} className="w-10 h-10 object-contain"/> : <div className="w-10 h-10 bg-gray-200 rounded"/>}
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-gray-600">{c.location || c.industry || '—'}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {(!loading && companies.length === 0) && (
        <p className="text-gray-600">No companies found.</p>
      )}
    </div>
  );
}
