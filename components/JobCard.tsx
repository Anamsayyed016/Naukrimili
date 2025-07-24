import React from 'react';
import { JobApplication } from './JobApplication';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface JobCardProps {
  job: {
    _id: string;
    title: string;
    description: string;
    company: string;
    location: string;
    salary?: string;
  };
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const handleApplicationSuccess = () => {
    // You can add additional logic here, like updating UI or parent component
    console.log('Application submitted successfully');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{job.title}</CardTitle>
        <CardDescription>{job.company} • {job.location}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600">{job.description}</p>
          {job.salary && (
            <p className="text-sm text-gray-500">
              Salary: {job.salary}
            </p>
          )}
          <div className="flex justify-end">
            <JobApplication 
              jobId={job._id}
              onSuccess={handleApplicationSuccess}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;
