'use client';

import { useState } from 'react';
import axios from 'axios';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface FraudAlertProps {
  applicantId: string;
  applicantName?: string;
  suspicious_signals?: string[];
}

export function FraudAlert({ applicantId, applicantName, suspicious_signals = [] }: FraudAlertProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { reportFraud } = useFraud();

  const flagApplicant = async () => {
    try {
      setIsLoading(true);
      await reportFraud({ 
        applicantId,
        signals: suspicious_signals,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: 'Report Submitted',
        description: 'Our team will investigate this case. Thank you for reporting.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit fraud report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Alert variant="destructive" className="border-l-4 border-red-500 bg-red-50">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-red-800">Suspicious Activity Detected</AlertTitle>
      <AlertDescription className="mt-2 text-red-700">
        {suspicious_signals.length > 0 ? (
          <div className="space-y-2">
            <p>We've detected potentially suspicious activity:</p>
            <ul className="list-disc pl-4">
              {suspicious_signals.map((signal, index) => (
                <li key={index}>{signal}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Unusual activity has been detected with this application.</p>
        )}
      </AlertDescription>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            className="mt-4"
            disabled={isLoading}
          >
            {isLoading ? 'Reporting...' : 'Report Fraud'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report Fraudulent Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to report {applicantName || 'this applicant'} for suspicious activity? 
              This will trigger an investigation by our trust & safety team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={flagApplicant}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Alert>
  );
}
