import useSWR from 'swr';

export interface CompanyStats {
  activeJobs: number;
  candidates: number;
  interviews: number;
  companyRating: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useCompanyStats(companyId: string) {
  // Replace with your real API endpoint
  const { data, error, isLoading } = useSWR<CompanyStats>(
    companyId ? `/api/company/${companyId}/stats` : null,
    fetcher
  );
  return {
    stats: data,
    isLoading,
    isError: !!error,
  };
} 