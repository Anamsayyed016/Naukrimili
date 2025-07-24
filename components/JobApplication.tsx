import React from 'react';
import { applyForJob } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

interface JobApplicationProps {
  jobId: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const JobApplication: React.FC<JobApplicationProps> = ({
  jobId,
  onSuccess,
  onError
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleApply = async () => {
    try {
      setIsSubmitting(true);
      await applyForJob(jobId);
      
      toast({
        title: "Success!",
        description: "Your application has been submitted successfully.",
        variant: "success",
      });
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Error applying:', error);
      
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to submit application",
        variant: "destructive",
      });
      
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      onClick={handleApply}
      disabled={isSubmitting}
      className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
    >
      {isSubmitting ? 'Submitting...' : 'Apply Now'}
    </button>
  );
};

export default JobApplication;
