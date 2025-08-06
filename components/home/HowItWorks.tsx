'use client';
import useSWR from 'swr';
import { getDemoHowItWorks } from '@/lib/demo-data';

const fetcher = async () => getDemoHowItWorks();

export default function HowItWorks() {
  const { data, error, isLoading } = useSWR('demo-how-it-works', fetcher);

  if (isLoading) return <div>Loading steps...</div>;
  if (error) return <div>Failed to load steps.</div>;
  if (!data) return <div>No data available.</div>;

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold mb-4">How It Works</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {data.steps?.map((step: Record<string, unknown>, i: number) => (
          <div key={i} className="p-4 bg-white rounded shadow">
            <h3 className="font-semibold mb-2">{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
    </section>)} 