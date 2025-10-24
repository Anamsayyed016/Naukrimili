/**
 * Enhanced React Query Provider
 * Provides global query client configuration with error handling, retry logic, and offline support
 */

"use client";

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import ErrorBoundary from './ErrorBoundary';

// Global query client configuration
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        console.error('Mutation error:', error);
        // Only show toast if component is still mounted
        try {
          toast({
            title: 'Error',
            description: error?.message || 'Something went wrong',
            variant: 'destructive',
          });
        } catch (toastError) {
          console.error('Toast error:', toastError);
        }
      },
    },
  },
});

// Custom hook for managing query client
function useQueryClientManager() {
  const [queryClient] = React.useState(() => createQueryClient());
  
  // Reset query client (useful for logout)
  const resetQueryClient = React.useCallback(() => {
    queryClient.clear();
  }, [queryClient]);
  
  // Prefetch queries for better performance
  const prefetchQueries = React.useCallback(async (queries: Array<{ queryKey: any[]; queryFn: () => Promise<any> }>) => {
    await Promise.all(
      queries.map(({ queryKey, queryFn }) =>
        queryClient.prefetchQuery({
          queryKey,
          queryFn,
        })
      )
    );
  }, [queryClient]);
  
  // Invalidate and refetch specific queries
  const invalidateAndRefetch = React.useCallback(async (queryKeys: any[]) => {
    await Promise.all(
      queryKeys.map(queryKey =>
        queryClient.invalidateQueries({ queryKey, refetchType: 'all' })
      )
    );
  }, [queryClient]);
  
  return {
    queryClient,
    resetQueryClient,
    prefetchQueries,
    invalidateAndRefetch,
  };
}

// Main provider component
export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { queryClient } = useQueryClientManager();
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
        
        {/* Development tools - REMOVED to eliminate floating button */}
        {/* {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools
            initialIsOpen={false}
            position="bottom"
            buttonPosition="bottom-right"
          />
        )} */}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Export the hook for use in other components
export { useQueryClientManager };

// Export query client utilities
export const queryClientUtils = {
  // Prefetch common queries
  prefetchCommonQueries: async (queryClient: QueryClient) => {
    // Prefetch job categories
    await queryClient.prefetchQuery({
      queryKey: ['jobs', 'categories'],
      queryFn: () => fetch('/api/jobs/categories').then(res => res.json()),
      staleTime: 30 * 60 * 1000, // 30 minutes
    });
    
    // Prefetch user profile if authenticated
    const token = localStorage.getItem('auth_token');
    if (token) {
      await queryClient.prefetchQuery({
        queryKey: ['user', 'profile'],
        queryFn: () => fetch('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.json()),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }
  },
  
  // Clear sensitive data on logout
  clearSensitiveData: (queryClient: QueryClient) => {
    queryClient.removeQueries({ queryKey: ['user'] });
    queryClient.removeQueries({ queryKey: ['applications'] });
    queryClient.removeQueries({ queryKey: ['resumes'] });
    queryClient.removeQueries({ queryKey: ['companies', 'current'] });
  },
  
  // Optimistic update helpers
  optimisticUpdate: function<T>(
    queryClient: QueryClient,
    queryKey: any[],
    updater: (oldData: T | undefined) => T
  ) {
    queryClient.setQueryData(queryKey, updater);
  },
  
  // Rollback optimistic updates
  rollbackOptimisticUpdate: function<T>(
    queryClient: QueryClient,
    queryKey: any[],
    previousData: T | undefined
  ) {
    queryClient.setQueryData(queryKey, previousData);
  },
};
