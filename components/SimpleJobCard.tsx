import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, DollarSign, Building2 } from 'lucide-react';

interface SimpleJobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
    type: string;
    postedAt: string;
    description?: string;
  };
  onApply?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
}

export function SimpleJobCard({ job, onApply, onViewDetails }: SimpleJobCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold hover:text-blue-600 cursor-pointer">
              {job.title}
            </CardTitle>
            <div className="flex items-center text-muted-foreground">
              <Building2 className="h-4 w-4 mr-1" />
              <span>{job.company}</span>
            </div>
          </div>
          <Badge variant="secondary">{job.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{job.location}</span>
            </div>
            {job.salary && (
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>{job.salary}</span>
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{job.postedAt}</span>
            </div>
          </div>
          
          {job.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {job.description}
            </p>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => onApply?.(job.id)}
              className="flex-1"
            >
              Apply Now
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onViewDetails?.(job.id)}
              className="flex-1"
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}