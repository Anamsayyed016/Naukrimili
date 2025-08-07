import type {
  UnifiedJob
}
} from '@/types/jobs';

export interface JobSearchResult {
  jobs: UnifiedJob[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean
}
}
}
export interface JobSearchResponse {
  success: boolean;
  data?: JobSearchResult;
  error?: {
    message: string;
}
}}
    details?: unknown}
}