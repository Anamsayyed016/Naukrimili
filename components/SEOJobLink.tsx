import Link from 'next/link';

interface SEOJobLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export default function SEOJobLink({ href, children, className, title }: SEOJobLinkProps) {
  return (
    <Link 
      href={href} 
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