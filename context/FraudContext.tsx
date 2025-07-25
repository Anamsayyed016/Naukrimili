'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { FraudMetrics, FraudReport, FraudDetectionRule } from '@/types/fraud';

interface FraudContextType {
  metrics: FraudMetrics | null;
  activeRules: FraudDetectionRule[];
  recentReports: FraudReport[];
  isLoading: boolean;
  reportFraud: (data: any) => Promise<void>;
  updateRules: (rules: FraudDetectionRule[]) => Promise<void>;
  refreshMetrics: () => Promise<void>;
}

const FraudContext = createContext<FraudContextType | undefined>(undefined);

export function FraudProvider({ children }: { children: React.ReactNode }) {
  const [metrics, setMetrics] = useState<FraudMetrics | null>(null);
  const [activeRules, setActiveRules] = useState<FraudDetectionRule[]>([]);
  const [recentReports, setRecentReports] = useState<FraudReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const { data } = await axios.get('/api/admin/fraud/metrics');
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching fraud metrics:', error);
    }
  };

  const fetchRules = async () => {
    try {
      const { data } = await axios.get('/api/admin/fraud/rules');
      setActiveRules(data);
    } catch (error) {
      console.error('Error fetching fraud rules:', error);
    }
  };

  const fetchRecentReports = async () => {
    try {
      const { data } = await axios.get('/api/admin/fraud/recent-reports');
      setRecentReports(data);
    } catch (error) {
      console.error('Error fetching recent fraud reports:', error);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchMetrics(),
      fetchRules(),
      fetchRecentReports()
    ]).finally(() => setIsLoading(false));

    // Refresh metrics every 5 minutes
    const interval = setInterval(fetchMetrics, 300000);
    return () => clearInterval(interval);
  }, []);

  const reportFraud = async (data: any) => {
    try {
      await axios.post('/api/employer/fraud-flag', data);
      fetchRecentReports();
      fetchMetrics();
    } catch (error) {
      throw error;
    }
  };

  const updateRules = async (rules: FraudDetectionRule[]) => {
    try {
      await axios.put('/api/admin/fraud/rules', { rules });
      setActiveRules(rules);
    } catch (error) {
      throw error;
    }
  };

  const refreshMetrics = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchMetrics(),
        fetchRecentReports()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FraudContext.Provider
      value={{
        metrics,
        activeRules,
        recentReports,
        isLoading,
        reportFraud,
        updateRules,
        refreshMetrics
      }}
    >
      {children}
    </FraudContext.Provider>
  );
}

export const useFraud = () => {
  const context = useContext(FraudContext);
  if (context === undefined) {
    throw new Error('useFraud must be used within a FraudProvider');
  }
  return context;
};
