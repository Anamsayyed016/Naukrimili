'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FraudReport {
  id: string;
  type: 'job' | 'user' | 'company';
  severity: 'low' | 'medium' | 'high';
  description: string;
  reportedAt: string;
  status: 'pending' | 'investigating' | 'resolved';
}

export function FraudDetectionReports() {
  const [reports, setReports] = useState<FraudReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFraudReports();
  }, []);

  const fetchFraudReports = async () => {
    try {
      const response = await fetch('/api/admin/fraud-reports');
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching fraud reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Fraud Detection Reports</h2>
      {isLoading ? (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="capitalize">{report.type}</TableCell>
                <TableCell>
                  <Badge className={getSeverityColor(report.severity)}>
                    {report.severity}
                  </Badge>
                </TableCell>
                <TableCell>{report.description}</TableCell>
                <TableCell>{new Date(report.reportedAt).toLocaleDateString()}</TableCell>
                <TableCell className="capitalize">{report.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
