"use client";

import Link from 'next/link';
import { generateSEOJobUrl, cleanJobDataForSEO, SEOJobData } from '@/lib/seo-url-utils';

interface SEOJobLinkProps {
  job: any; // Raw job data
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  target?: string;
  rel?: string;
}

/**
 * Component that generates SEO-friendly job URLs automatically
 */
export default function SEOJobLink({ 
  job, 
  children, 
  className = '', 
  onClick,
  target,
  rel 
}: SEOJobLinkProps) {
  // Clean and prepare job data for SEO URL generation
  const cleanJob = cleanJobDataForSEO(job);
  
  // Generate SEO-friendly URL
  const seoUrl = generateSEOJobUrl(cleanJob);
  
  return (
    <Link
      href={seoUrl}
      className={className}
      onClick={onClick}
      target={target}
      rel={rel}
    >
      {children}
    </Link>
  );
}

/**
 * Hook to get SEO-friendly job URL
 */
export function useSEOJobUrl(job: any): string {
  const cleanJob = cleanJobDataForSEO(job);
  return generateSEOJobUrl(cleanJob);
}

/**
 * Component for generating SEO-friendly job URLs in job listings
 */
interface JobCardLinkProps {
  job: any;
  children: React.ReactNode;
  className?: string;
  showPreview?: boolean;
}

export function JobCardLink({ 
  job, 
  children, 
  className = '',
  showPreview = false 
}: JobCardLinkProps) {
  const cleanJob = cleanJobDataForSEO(job);
  const seoUrl = generateSEOJobUrl(cleanJob);
  
  return (
    <Link
      href={seoUrl}
      className={`block ${className}`}
      title={`${job.title} at ${job.company} in ${job.location}`}
    >
      {children}
    </Link>
  );
}

/**
 * Utility function to generate job URL for external use
 */
export function getJobUrl(job: any): string {
  const cleanJob = cleanJobDataForSEO(job);
  return generateSEOJobUrl(cleanJob);
}

/**
 * Component for generating shareable job URLs
 */
interface ShareableJobUrlProps {
  job: any;
  baseUrl?: string;
}

export function ShareableJobUrl({ job, baseUrl }: ShareableJobUrlProps) {
  const cleanJob = cleanJobDataForSEO(job);
  const seoUrl = generateSEOJobUrl(cleanJob);
  const fullUrl = baseUrl ? `${baseUrl}${seoUrl}` : seoUrl;
  
  return fullUrl;
}
