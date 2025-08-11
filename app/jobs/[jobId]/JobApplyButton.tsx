'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobApplyButtonProps {
  url: string | null;
}

export function JobApplyButton({ url }: JobApplyButtonProps) {
  if (!url) {
    return (
      <Button variant="outline" disabled>
        Application URL not available
      </Button>
    );
  }

  return (
    <Button asChild>
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
        Apply Now
        <ExternalLink size={16} />
      </a>
    </Button>
  );
}
