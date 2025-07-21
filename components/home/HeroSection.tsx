'use client';
import useSWR from 'swr';
import { getDemoHero } from '@/lib/demo-data';

const fetcher = async () => getDemoHero();

export default function HeroSection() {
  const { data, error, isLoading } = useSWR('demo-hero', fetcher);

  if (isLoading) return <div>Loading hero...</div>;
  if (error) return <div>Failed to load hero section.</div>;

  return (
    <section className="text-center py-12">
      <h1 className="text-4xl font-bold mb-4">{data.headline}</h1>
      <p className="text-lg mb-6">{data.subheadline}</p>
      {data.image && <img src={data.image} alt="Hero" className="mx-auto max-w-md rounded-lg shadow" />}
    </section>
  );
} 