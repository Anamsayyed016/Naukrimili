# 🚀 Dynamic API Integration Guide

## Overview

This guide explains how to use the new dynamic API integration system that replaces mock data with real backend APIs. The system provides:

- **Real-time data fetching** with React Query
- **Automatic caching** and background updates
- **Error handling** and retry logic
- **Authentication** and session management
- **Optimistic updates** for better UX
- **Offline support** and network resilience

## 🏗️ Architecture

### Core Components

1. **API Client** (`lib/api-client.ts`)
   - Handles all HTTP requests
   - Manages authentication headers
   - Provides consistent error handling
   - Supports file uploads with progress

2. **React Query Hooks** (`hooks/use*Query.ts`)
   - Replace old custom hooks
   - Provide caching and background updates
   - Handle loading, error, and success states
   - Support optimistic updates

3. **Error Boundaries** (`components/ErrorBoundary.tsx`)
   - Catch and handle component errors
   - Provide user-friendly error messages
   - Support retry and recovery

4. **Query Provider** (`components/ReactQueryProvider.tsx`)
   - Global query client configuration
   - Error handling and retry logic
   - Development tools integration

## 📚 Available Hooks

### Jobs
```typescript
import { 
  useJobs, 
  useJob, 
  useJobSearch, 
  useCreateJob, 
  useUpdateJob, 
  useDeleteJob,
  useToggleJobBookmark,
  useApplyToJob 
} from '@/hooks/useJobsQuery';

// Fetch jobs with filters
const { data, isLoading, error } = useJobs({ 
  location: 'Bangalore', 
  jobType: 'full-time' 
});

// Create new job
const createJob = useCreateJob();
const handleSubmit = (jobData) => {
  createJob.mutate(jobData);
};
```

### Users & Authentication
```typescript
import { 
  useCurrentUser, 
  useUpdateProfile, 
  useChangePassword,
  useUploadProfilePicture 
} from '@/hooks/useUsersQuery';

// Get current user
const { data: user, isLoading } = useCurrentUser();

// Update profile
const updateProfile = useUpdateProfile();
const handleUpdate = (profileData) => {
  updateProfile.mutate(profileData);
};
```

### Companies
```typescript
import { 
  useCompanies, 
  useCompany, 
  useCurrentCompany,
  useCreateCompany, 
  useUpdateCompany 
} from '@/hooks/useCompaniesQuery';

// Get current company (for employers)
const { data: company } = useCurrentCompany();

// Create company
const createCompany = useCreateCompany();
```

### Applications
```typescript
import { 
  useApplications, 
  useUserApplications, 
  useJobApplications,
  useCreateApplication, 
  useUpdateApplicationStatus 
} from '@/hooks/useApplicationsQuery';

// Get user's applications
const { data: applications } = useUserApplications(userId);

// Update application status
const updateStatus = useUpdateApplicationStatus();
const handleStatusUpdate = (applicationId, status) => {
  updateStatus.mutate({ id: applicationId, status, notes: 'Updated' });
};
```

### Resumes
```typescript
import { 
  useResumes, 
  useUserResumes, 
  useUploadResume,
  useAnalyzeResume, 
  useGenerateResume 
} from '@/hooks/useResumesQuery';

// Upload resume
const uploadResume = useUploadResume();
const handleUpload = (file) => {
  uploadResume.mutate(file, {
    onSuccess: (resume) => {
      console.log('Resume uploaded:', resume);
    }
  });
};
```

## 🔄 Migration from Mock Data

### Before (Mock Data)
```typescript
// Old way - importing mock data
import { mockJobs } from '@/lib/mockData';

function JobList() {
  const [jobs, setJobs] = useState(mockJobs);
  // ... rest of component
}
```

### After (Real API)
```typescript
// New way - using React Query hooks
import { useJobs } from '@/hooks/useJobsQuery';

function JobList() {
  const { data: jobs, isLoading, error } = useJobs();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {jobs?.jobs?.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
```

### Before (Custom Fetch Hooks)
```typescript
// Old way - custom hooks with manual state
import { useJobsApi } from '@/hooks/useJobsApi';

function JobList() {
  const { jobs, loading, error, fetchJobs } = useJobsApi();
  
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);
  
  // ... rest of component
}
```

### After (React Query Hooks)
```typescript
// New way - automatic data fetching
import { useJobs } from '@/hooks/useJobsQuery';

function JobList() {
  const { data, isLoading, error } = useJobs();
  
  // Data is automatically fetched, cached, and updated
  // No need for useEffect or manual state management
}
```

## 🎯 Best Practices

### 1. Loading States
```typescript
function JobList() {
  const { data, isLoading, error } = useJobs();
  
  if (isLoading) {
    return <JobListSkeleton />;
  }
  
  if (error) {
    return <ErrorMessage error={error} />;
  }
  
  return <JobListContent jobs={data?.jobs} />;
}
```

### 2. Error Handling
```typescript
import { ApiErrorHandler } from '@/components/ErrorBoundary';

function JobList() {
  const { data, error, refetch } = useJobs();
  
  if (error) {
    return (
      <ApiErrorHandler 
        error={error} 
        onRetry={refetch}
        onGoBack={() => window.history.back()}
      />
    );
  }
  
  return <JobListContent jobs={data?.jobs} />;
}
```

### 3. Optimistic Updates
```typescript
function JobCard({ job }) {
  const toggleBookmark = useToggleJobBookmark();
  
  const handleBookmark = () => {
    // Optimistically update UI
    toggleBookmark.mutate(
      { jobId: job.id, bookmarked: !job.isBookmarked },
      {
        onError: (error) => {
          // Rollback on error
          console.error('Failed to bookmark:', error);
        }
      }
    );
  };
  
  return (
    <button onClick={handleBookmark}>
      {job.isBookmarked ? '❤️' : '🤍'}
    </button>
  );
}
```

### 4. Conditional Fetching
```typescript
function UserProfile({ userId }) {
  const { data: user } = useUser(userId, {
    enabled: !!userId, // Only fetch if userId exists
  });
  
  if (!userId) return <div>No user selected</div>;
  if (!user) return <div>Loading...</div>;
  
  return <ProfileContent user={user} />;
}
```

### 5. Pagination
```typescript
function JobList() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useJobs({ page, limit: 10 });
  
  const handlePageChange = (newPage) => {
    setPage(newPage);
    // Query automatically refetches with new page
  };
  
  return (
    <div>
      <JobListContent jobs={data?.jobs} />
      <Pagination 
        currentPage={page}
        totalPages={data?.pagination?.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
```

## 🔐 Authentication

### Protected Routes
```typescript
import { AuthGuard } from '@/components/auth/AuthGuard';

function ProtectedPage() {
  return (
    <AuthGuard allowedRoles={['employer']} requireProfileCompletion={true}>
      <EmployerDashboard />
    </AuthGuard>
  );
}
```

### API Authentication
```typescript
// Authentication is handled automatically by the API client
// No need to manually add headers

const { data } = useCurrentUser(); // Automatically includes auth token
const updateProfile = useUpdateProfile(); // Automatically includes auth token
```

## 📊 Data Caching

### Cache Invalidation
```typescript
// Queries are automatically invalidated when related data changes
const createJob = useCreateJob(); // Automatically invalidates job lists
const updateUser = useUpdateUser(); // Automatically invalidates user data
```

### Manual Cache Management
```typescript
import { useQueryClient } from '@tanstack/react-query';

function LogoutButton() {
  const queryClient = useQueryClient();
  
  const handleLogout = () => {
    // Clear all cached data
    queryClient.clear();
    // Redirect to login
    router.push('/login');
  };
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

## 🚨 Error Handling

### Global Error Boundary
```typescript
// Wrap your app with ErrorBoundary
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

### Component-Level Error Handling
```typescript
import { useErrorHandler } from '@/components/ErrorBoundary';

function MyComponent() {
  const { error, handleError, clearError } = useErrorHandler();
  
  const handleRiskyOperation = async () => {
    try {
      await riskyApiCall();
    } catch (err) {
      handleError(err);
    }
  };
  
  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={clearError}>Try Again</button>
      </div>
    );
  }
  
  return <div>Component content</div>;
}
```

## 🔧 Configuration

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
DATABASE_URL=postgresql://user:pass@localhost:5432/jobportal
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### Query Client Options
```typescript
// Customize query client behavior
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
    },
  },
});
```

## 📱 Offline Support

### Network Status Detection
```typescript
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  
  if (!isOnline) {
    return <div className="bg-yellow-100 p-2">You're offline</div>;
  }
  
  return null;
}
```

### Offline Queue
```typescript
// Mutations are automatically queued when offline
const createJob = useCreateJob();

// This will be queued if offline and executed when back online
createJob.mutate(jobData);
```

## 🧪 Testing

### Mock API Responses
```typescript
// In your test files
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/jobs', (req, res, ctx) => {
    return res(ctx.json({ jobs: mockJobs }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Testing Hooks
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useJobs } from '@/hooks/useJobsQuery';

test('useJobs fetches data', async () => {
  const { result } = renderHook(() => useJobs());
  
  await waitFor(() => {
    expect(result.current.data).toBeDefined();
  });
});
```

## 📈 Performance Optimization

### Prefetching
```typescript
import { useQueryClient } from '@tanstack/react-query';

function JobCard({ job }) {
  const queryClient = useQueryClient();
  
  const prefetchJobDetails = () => {
    queryClient.prefetchQuery({
      queryKey: ['jobs', 'detail', job.id],
      queryFn: () => fetchJobDetails(job.id),
    });
  };
  
  return (
    <Link 
      href={`/jobs/${job.id}`}
      onMouseEnter={prefetchJobDetails}
    >
      {job.title}
    </Link>
  );
}
```

### Infinite Queries
```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

function InfiniteJobList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['jobs', 'infinite'],
    queryFn: ({ pageParam = 1 }) => fetchJobs({ page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
  
  return (
    <div>
      {data?.pages.map((page, i) => (
        <JobList key={i} jobs={page.jobs} />
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          Load More
        </button>
      )}
    </div>
  );
}
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Configuration
```bash
# Production environment
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api.com
DATABASE_URL=your-production-db-url
```

### Monitoring
```typescript
// Add error tracking in production
if (process.env.NODE_ENV === 'production') {
  // Sentry, LogRocket, etc.
  Sentry.captureException(error);
}
```

## 📚 Additional Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)

## 🤝 Support

If you encounter issues or have questions:

1. Check the error logs in the browser console
2. Verify your API endpoints are working
3. Ensure authentication is properly configured
4. Check the network tab for failed requests

## 🔄 Migration Checklist

- [ ] Replace mock data imports with React Query hooks
- [ ] Update components to handle loading and error states
- [ ] Test authentication flows
- [ ] Verify error boundaries are working
- [ ] Test offline scenarios
- [ ] Performance testing
- [ ] Update tests to use mock API responses
- [ ] Documentation updates

---

**Happy coding! 🎉**

This system provides a robust foundation for building scalable, performant applications with real-time data synchronization and excellent user experience.
