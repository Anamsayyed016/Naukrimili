'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { getDemoHero } from '@/lib/demo-data';
import { useQuery } from '@tanstack/react-query';

interface HeroSectionProps {
  isDemoMode?: boolean;
}

export default function HeroSection({ isDemoMode = false }: HeroSectionProps) {
  const { data: session } = useSession();
  const { data: demoData, isError, isLoading } = useQuery({
    queryKey: ['demo-hero'],
    queryFn: getDemoHero,
    enabled: isDemoMode
  });

  // Show demo version if in demo mode
  if (isDemoMode) {
    if (isError) return <div>Failed to load hero section.</div>;
    if (isLoading || !demoData) return <div>Loading hero...</div>;

    return (
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">{demoData.headline}</h1>
        <p className="text-lg mb-6">{demoData.subheadline}</p>
        {demoData.image && (
          <div className="relative mx-auto max-w-md">
            <Image 
              src={demoData.image} 
              alt="Hero" 
              width={768}
              height={432}
              className="rounded-lg shadow" 
              priority
            />
          </div>
        )}
      </section>
    );
  }

  // Main hero section
  return (
    <section className="hero bg-gradient-to-r from-blue-600 to-indigo-800 text-white py-20 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Find Your Dream Job with <span className="text-yellow-300">NaukriMili</span>
        </h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          AI-powered job matching, resume analysis, and career tools for job seekers and employers.
        </p>
        <div className="space-x-4">
          {!session ? (
            <>
              <Link 
                href="/auth/register" 
                className="inline-block bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-full font-medium transition-colors"
              >
                Get Started
              </Link>
              <Link 
                href="/jobs" 
                className="inline-block bg-transparent hover:bg-white/10 px-6 py-3 rounded-full font-medium border-2 border-white transition-colors"
              >
                Browse Jobs
              </Link>
            </>
          ) : (
            <Link 
              href="/dashboard" 
              className="inline-block bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-full font-medium transition-colors"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </section>
  );
} 