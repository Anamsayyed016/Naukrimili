"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type LocationRow = {
  id: string;
  name: string;
  country: string;
  display_name: string;
  job_count: number;
  latest_job_date: string | null;
  job_types: Record<string, number>;
  work_arrangements: { on_site: number; remote: number; hybrid: number };
  salary_stats: {
    average_min: number | null;
    average_max: number | null;
    lowest: number | null;
    highest: number | null;
    currency?: string;
  };
};

export default function LocationExplorer() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [sortBy, setSortBy] = useState<'job_count' | 'latest'>('job_count');
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchLocations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (country) params.set('country', country);
      params.set('page', String(page));
      params.set('limit', String(limit));
      params.set('sort_by', sortBy);
      const res = await fetch(`/api/locations?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load locations');
      setRows(data.locations);
      setTotal(data.pagination?.total_results || 0);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLocations();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city or country"
              className="pl-10 h-12"
            />
          </div>
        </div>
        <div className="md:col-span-3">
          <Input
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            placeholder="Country code (e.g., IN, US)"
            className="h-12"
          />
        </div>
        <div className="md:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full h-12 rounded-md border border-gray-300 px-3"
          >
            <option value="job_count">Sort by job count</option>
            <option value="latest">Sort by latest</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <button className="w-full h-12 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium">Search</button>
        </div>
      </form>

      {isLoading && (
        <div className="text-center py-8">Loading locations…</div>
      )}
      {error && (
        <div className="text-center py-8 text-red-600">{error}</div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rows.map((loc) => (
            <Card key={loc.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold">{loc.display_name}</div>
                    <div className="text-sm text-gray-500">{loc.job_count} jobs</div>
                  </div>
                  {loc.salary_stats?.average_max ? (
                    <Badge variant="secondary">
                      Avg. {loc.salary_stats.currency || ''} {loc.salary_stats.average_min ? (loc.salary_stats.average_min || 0).toLocaleString() : ''}
                      {loc.salary_stats.average_max ? ` - ${(loc.salary_stats.average_max || 0).toLocaleString()}` : ''}
                    </Badge>
                  ) : null}
                </div>
                <div className="flex gap-2 flex-wrap text-xs text-gray-600">
                  {Object.entries(loc.job_types || {}).slice(0, 3).map(([t, c]) => (
                    <span key={t} className="px-2 py-1 bg-gray-100 rounded-full">{t}: {c as number}</span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-blue-50 rounded-md p-2 text-center">
                    On-site
                    <div className="font-semibold">{loc.work_arrangements?.on_site || 0}</div>
                  </div>
                  <div className="bg-green-50 rounded-md p-2 text-center">
                    Remote
                    <div className="font-semibold">{loc.work_arrangements?.remote || 0}</div>
                  </div>
                  <div className="bg-purple-50 rounded-md p-2 text-center">
                    Hybrid
                    <div className="font-semibold">{loc.work_arrangements?.hybrid || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 pt-4">
        <button
          className="px-4 py-2 rounded-md border disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || isLoading}
        >
          Prev
        </button>
        <div className="text-sm">Page {page} of {totalPages}</div>
        <button
          className="px-4 py-2 rounded-md border disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || isLoading}
        >
          Next
        </button>
      </div>
    </div>
  );
}


