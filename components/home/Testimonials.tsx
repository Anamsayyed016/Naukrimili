'use client';
import useSWR from 'swr';
import { getDemoTestimonials } from '@/lib/demo-data';

const fetcher = async () => getDemoTestimonials();

export default function Testimonials() {
  const { data, error, isLoading } = useSWR('demo-testimonials', fetcher);

  if (isLoading) return <div>Loading testimonials...</div>;
  if (error) return <div>Failed to load testimonials.</div>;
  if (!data) return <div>No testimonials available.</div>;

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold mb-4">Testimonials</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.testimonials.map((t: any) => (
          <div key={t.id} className="p-4 bg-white rounded shadow">
            <p className="mb-2">"{t.text}"</p>
            <div className="font-semibold text-company-700">- {t.name}</div>
          </div>
        ))}
      </div>
    </section>
  );
} 