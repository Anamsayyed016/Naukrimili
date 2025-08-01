import { createContext, useContext, useState } from 'react';
import { toast } from 'sonner';
import { ICandidate } from '@/models';

interface CandidateContextType {
  candidates: ICandidate[];
  loading: boolean;
  error: string | null;
  refreshCandidates: () => Promise<void>;
  updateCandidateStatus: (candidateId: string, status: ICandidate['status']) => Promise<void>;
}

const CandidateContext = createContext<CandidateContextType | undefined>(undefined);

export function CandidateProvider({ children }: { children: React.ReactNode }) {
  const [candidates, setCandidates] = useState<ICandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/candidates');
      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }
      const data = await response.json();
      setCandidates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  };

  const updateCandidateStatus = async (candidateId: string, status: ICandidate['status']) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update candidate status');
      }

      await refreshCandidates();
      toast.success('Candidate status updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to update candidate status');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    candidates,
    loading,
    error,
    refreshCandidates,
    updateCandidateStatus,
  };

  return (
    <CandidateContext.Provider value={value}>
      {children}
    </CandidateContext.Provider>
  );
}

export function useCandidates() {
  const context = useContext(CandidateContext);
  if (context === undefined) {
    throw new Error('useCandidates must be used within a CandidateProvider');
  }
  return context;
}
