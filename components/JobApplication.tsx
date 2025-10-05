'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { applicationApi } from '@/lib/api';
import { useErrorHandler } from '@/lib/error-boundary';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronRight } from 'lucide-react';

interface JobApplicationProps {
  jobId: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const JobApplication: React.FC<JobApplicationProps> = ({
  jobId,
  onSuccess,
  onError,
  variant = 'default',
  size = 'default',
  className = ''
}) => {
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const handleError = useErrorHandler();

  const handleApply = async () => {
    // Check if user is authenticated
    if (!session?.user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to apply for this job.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      await applicationApi.applyForJob(jobId, {
        jobId,
        status: 'submitted'
      });
      
      toast({
        title: "Application Submitted!",
        description: "Your application has been submitted successfully. We'll notify you of any updates.",
        variant: "default"
      });
      
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Error applying for job: ', error);
      handleError(error instanceof Error ? error : new Error(String(error)), 'JobApplication');
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <Button disabled variant={variant} size={size} className={className}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  // Show login prompt if not authenticated
  if (!session?.user?.id) {
    return (
      <Button 
        onClick={() => window.location.href = '/auth/signin'} 
        variant={variant} 
        size={size} 
        className={className}
      >
        Login to Apply
        <ChevronRight className="w-4 h-4 ml-2" />
      </Button>
    );
  }

  return (
    <Button
      onClick={handleApply}
      disabled={isSubmitting}
      variant={variant}
      size={size}
      className={className}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Submitting...
        </>
      ) : (
        <>
          Apply Now
          <ChevronRight className="w-4 h-4 ml-2" />
        </>
      )}
    </Button>
  );
};

export default JobApplication;
