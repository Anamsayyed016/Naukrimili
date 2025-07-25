'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface JobVerification {
  id: string;
  jobTitle: string;
  company: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  flags: string[];
  employerInfo: {
    name: string;
    email: string;
    verificationScore: number;
  };
}

export function JobVerificationQueue() {
  const [jobs, setJobs] = useState<JobVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/admin/jobs/verification');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobAction = async (jobId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      
      if (response.ok) {
        fetchJobs(); // Refresh the list
      }
    } catch (error) {
      console.error('Error verifying job:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Job Verification Queue</h2>
      {isLoading ? (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Details</TableHead>
              <TableHead>Employer</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{job.jobTitle}</div>
                    <div className="text-sm text-gray-500">{job.company}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div>{job.employerInfo.name}</div>
                    <div className="text-sm text-gray-500">{job.employerInfo.email}</div>
                    <Badge 
                      className={
                        job.employerInfo.verificationScore > 80 ? 'bg-green-100 text-green-800' :
                        job.employerInfo.verificationScore > 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }
                    >
                      Score: {job.employerInfo.verificationScore}%
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>{new Date(job.submittedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="space-x-1">
                    {job.flags.map((flag, index) => (
                      <Badge key={index} variant="outline">{flag}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      job.status === 'approved' ? 'bg-green-100 text-green-800' :
                      job.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {job.status === 'pending' && (
                    <div className="space-x-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleJobAction(job.id, 'approve')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleJobAction(job.id, 'reject')}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
