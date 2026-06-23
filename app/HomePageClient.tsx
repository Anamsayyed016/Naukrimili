"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import JobSearchHero from '@/components/JobSearchHero';
import type { HomePageCompany, HomePageJob } from '@/components/home/home-types';

const FeaturedJobsSectionLazy = dynamic(
  () => import('@/components/home/FeaturedJobsSection'),
  { ssr: true }
);

const TopCompaniesSectionLazy = dynamic(
  () => import('@/components/home/TopCompaniesSection'),
  { ssr: true }
);

interface HomePageClientProps {
  featuredJobs: HomePageJob[];
  topCompanies: HomePageCompany[];
}

export default function HomePageClient({
  featuredJobs,
  topCompanies
}: HomePageClientProps) {
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let idleId: number | undefined;

    const connectObserver = () => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const elementId = entry.target.getAttribute('data-animate-id');
              if (elementId) {
                setVisibleElements((prev) => new Set([...prev, elementId]));
              }
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px',
        }
      );

      const animatedElements = document.querySelectorAll('[data-animate-id]');
      animatedElements.forEach((el) => observer?.observe(el));
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(connectObserver, { timeout: 2000 });
    } else {
      connectObserver();
    }

    return () => {
      if (idleId !== undefined && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      observer?.disconnect();
    };
  }, [featuredJobs, topCompanies]);

  const getDelayClass = (index: number) => {
    const delays = ['delay-100', 'delay-200', 'delay-300', 'delay-400', 'delay-500', 'delay-600'];
    return delays[index] || 'delay-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100/40">
      <JobSearchHero />

      <FeaturedJobsSectionLazy
        featuredJobs={featuredJobs}
        visibleElements={visibleElements}
        getDelayClass={getDelayClass}
      />

      <TopCompaniesSectionLazy topCompanies={topCompanies} />
    </div>
  );
}
