import Link from 'next/link';

interface SEOJobLinkProps {
  href?: string;
  job?: any;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export default function SEOJobLink({ href, job, children, className, title }: SEOJobLinkProps) {
  // Generate href from job if not provided
  const linkHref = href || (job ? `/jobs/${job.id}` : '#');
  
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
export const useSEOJobUrl = (job: any) => {
  return `/jobs/${job.id}`;
};

// Function for generating job URLs
export const getJobUrl = (job: any) => {
  return `/jobs/${job.id}`;
};