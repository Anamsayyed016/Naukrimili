import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { ICandidate } from '@/types/candidate';

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

  const refreshCandidates = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch('/api/candidates');
      if (!response.ok) throw new Error('Failed to fetch candidates');
      const data = await response.json();
      setCandidates(Array.isArray(data) ? data : data.candidates || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
      toast.error('Failed to fetch candidates');
    } finally { setLoading(false); }
  }, []);

  const updateCandidateStatus = useCallback(async (candidateId: string, status: ICandidate['status']) => {
    setLoading(true); setError(null);
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update candidate status');
      await refreshCandidates();
      toast.success('Candidate status updated successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
      toast.error('Failed to update candidate status');
    } finally { setLoading(false); }
  }, [refreshCandidates]);

  const value: CandidateContextType = { candidates, loading, error, refreshCandidates, updateCandidateStatus };

  return <CandidateContext.Provider value={value}>{children}</CandidateContext.Provider>;
}

export function useCandidates() {
  const context = useContext(CandidateContext);
  if (!context) throw new Error('useCandidates must be used within a CandidateProvider');
  return context;
}