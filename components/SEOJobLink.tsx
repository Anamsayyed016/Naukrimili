import Link from 'next/link';
import { generateSEOJobUrl, cleanJobDataForSEO } from '@/lib/seo-url-utils';

interface SEOJobLinkProps {
  href?: string;
  job?: Record<string, unknown> & { id?: string | number };
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export default function SEOJobLink({ href, job, children, className, title }: SEOJobLinkProps) {
  // Generate href from job if not provided
  let linkHref = href;
  
  if (!linkHref && job) {
    try {
      // Try to generate SEO URL first
      const cleanJob = cleanJobDataForSEO(job);
      linkHref = generateSEOJobUrl(cleanJob);
    } catch (error) {
      // Fallback to simple ID-based URL
      console.warn('Failed to generate SEO URL, using fallback:', error);
      linkHref = `/jobs/${job.id}`;
    }
  }
  
  if (!linkHref) {
    linkHref = '#';
  }
  
  return (
    <Link 
      href={linkHref} 
      className={className}
      title={title}
    >
      {children}
    </Link>
  );
}

// Hook for generating SEO job URLs
export const useSEOJobUrl = (job: Record<string, unknown> & { id?: string | number }) => {
  try {
    const cleanJob = cleanJobDataForSEO(job);
    return generateSEOJobUrl(cleanJob);
  } catch (error) {
    console.warn('Failed to generate SEO URL, using fallback:', error);
    return `/jobs/${job.id}`;
  }
};

// Function for generating job URLs
export const getJobUrl = (job: Record<string, unknown> & { id?: string | number }) => {
  try {
    const cleanJob = cleanJobDataForSEO(job);
    return generateSEOJobUrl(cleanJob);
  } catch (error) {
    console.warn('Failed to generate SEO URL, using fallback:', error);
    return `/jobs/${job.id}`;
  }
};