# Complete Component Debug Guide for Aftionix Job Portal

## 🚀 Overview
This guide will help you debug and fix all components in your job portal to make it fully functional like other professional job portals.

## 📋 Pre-Debug Checklist

### 1. Environment Setup
- [ ] Node.js 18+ installed
- [ ] npm/yarn installed
- [ ] Database (PostgreSQL) running
- [ ] Environment variables configured
- [ ] Domain (aftionix.in) DNS configured

### 2. Dependencies
- [ ] All npm packages installed
- [ ] No version conflicts
- [ ] TypeScript compilation working
- [ ] Build process successful

## 🔧 Core Components Debug

### 1. Authentication System

#### NextAuth Configuration
```typescript
// app/api/auth/[...nextauth]/route.ts
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      // Add credentials provider
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
};
```

#### Common Issues & Fixes
- **Issue**: "Invalid redirect URI" error
  **Fix**: Add `https://aftionix.in/api/auth/callback/google` to Google OAuth console

- **Issue**: Session not persisting
  **Fix**: Check `NEXTAUTH_SECRET` environment variable

- **Issue**: Google OAuth not working
  **Fix**: Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### 2. Database & Prisma

#### Schema Validation
```bash
# Check Prisma schema
npx prisma validate

# Generate client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Check database connection
npx prisma db pull
```

#### Common Issues & Fixes
- **Issue**: "Database connection failed"
  **Fix**: Check `DATABASE_URL` and database server status

- **Issue**: "Prisma client not generated"
  **Fix**: Run `npx prisma generate`

- **Issue**: "Migration failed"
  **Fix**: Check database permissions and connection

### 3. API Routes

#### Health Check Endpoint
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
    }, { status: 500 });
  }
}
```

#### Common Issues & Fixes
- **Issue**: "API route not found"
  **Fix**: Check file naming and Next.js routing

- **Issue**: "CORS error"
  **Fix**: Add CORS headers or configure Next.js

- **Issue**: "Rate limiting"
  **Fix**: Implement proper rate limiting middleware

### 4. Frontend Components

#### Component Structure Check
```bash
# Check for missing imports
npm run lint

# Check TypeScript errors
npm run type-check

# Check build errors
npm run build
```

#### Common Issues & Fixes
- **Issue**: "Component not rendering"
  **Fix**: Check import paths and component exports

- **Issue**: "Styling not applied"
  **Fix**: Verify CSS imports and Tailwind configuration

- **Issue**: "State not updating"
  **Fix**: Check React hooks and state management

## 🎯 Specific Component Debug

### 1. Job Search Component

#### Debug Steps
1. Check API endpoint response
2. Verify search parameters
3. Test filters and sorting
4. Check pagination

#### Common Issues
```typescript
// Fix: Add error boundaries
const JobSearch = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchJobs = async (params) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/jobs/search?${new URLSearchParams(params)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setJobs(data.jobs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) return <div>Error: {error}</div>;
  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Job search form and results */}
    </div>
  );
};
```

### 2. Resume Upload Component

#### Debug Steps
1. Check file validation
2. Verify upload endpoint
3. Test file size limits
4. Check storage permissions

#### Common Issues
```typescript
// Fix: Add proper file validation
const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('resume', file);
    
    try {
      setUploading(true);
      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const result = await response.json();
      console.log('Upload successful:', result);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload Resume'}
      </button>
    </div>
  );
};
```

### 3. User Dashboard Component

#### Debug Steps
1. Check authentication state
2. Verify user data loading
3. Test navigation between sections
4. Check responsive design

#### Common Issues
```typescript
// Fix: Add proper authentication checks
const UserDashboard = () => {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'unauthenticated') return <div>Please sign in</div>;
  if (!userData) return <div>Loading user data...</div>;

  return (
    <div>
      <h1>Welcome, {userData.name}</h1>
      {/* Dashboard content */}
    </div>
  );
};
```

## 🐛 Error Handling & Logging

### 1. Global Error Boundary
```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to external service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 2. API Error Handling
```typescript
// lib/api-client.ts
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`/api${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new ApiError(response.status, await response.text());
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },
};
```

## 🔍 Performance Debugging

### 1. Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Check for unused dependencies
npx depcheck

# Monitor performance
npm run dev -- --turbo
```

### 2. Performance Monitoring
```typescript
// components/PerformanceMonitor.tsx
const PerformanceMonitor = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Monitor Core Web Vitals
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);
      });
    }
  }, []);

  return null;
};
```

## 🧪 Testing & Validation

### 1. Component Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=JobSearch.test.tsx
```

### 2. E2E Testing
```bash
# Install Playwright
npm install -D @playwright/test

# Run E2E tests
npx playwright test

# Run tests in headed mode
npx playwright test --headed
```

## 📱 Responsive Design Debug

### 1. Mobile Testing
```typescript
// hooks/useMobile.ts
export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};
```

### 2. Responsive Utilities
```css
/* styles/responsive.css */
@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }
}

@media (min-width: 769px) {
  .mobile-only {
    display: none !important;
  }
}
```

## 🚨 Emergency Fixes

### 1. Build Failures
```bash
# Clear Next.js cache
rm -rf .next
rm -rf node_modules/.cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### 2. Runtime Errors
```typescript
// Add error boundaries to all major components
// Implement proper error logging
// Add fallback UI for failed components
```

### 3. Database Issues
```bash
# Reset database
npx prisma migrate reset

# Check connection
npx prisma db pull

# Verify schema
npx prisma validate
```

## 📊 Monitoring & Analytics

### 1. Error Tracking
```typescript
// lib/error-tracking.ts
export const trackError = (error: Error, context?: any) => {
  // Send to error tracking service (Sentry, LogRocket, etc.)
  console.error('Error tracked:', error, context);
  
  // You can integrate with:
  // - Sentry
  // - LogRocket
  // - Bugsnag
  // - Custom error tracking
};
```

### 2. Performance Monitoring
```typescript
// lib/performance.ts
export const trackPerformance = (metric: string, value: number) => {
  // Send to analytics service
  console.log(`Performance: ${metric} = ${value}`);
  
  // You can integrate with:
  // - Google Analytics
  // - Mixpanel
  // - Custom analytics
};
```

## 🎯 Next Steps

1. **Run the debug checklist** above
2. **Fix any build errors** first
3. **Test each component** individually
4. **Implement error boundaries** for robustness
5. **Add comprehensive logging** for debugging
6. **Test on multiple devices** and browsers
7. **Monitor performance** and optimize
8. **Deploy to production** using the deployment scripts

## 📞 Support

If you encounter specific errors:
1. Check the browser console for error messages
2. Review the server logs for API errors
3. Verify environment variables are set correctly
4. Test database connectivity
5. Check component import/export statements

## 🔗 Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Remember**: Debug systematically, fix one issue at a time, and test thoroughly after each fix!
