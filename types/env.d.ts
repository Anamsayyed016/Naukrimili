declare namespace NodeJS {
  interface ProcessEnv {
    // Database
    MONGODB_URI: string;
    DATABASE_URL: string;
    
    // Authentication
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;
    
    // External Job APIs
    ADZUNA_APP_ID: string;
    ADZUNA_APP_KEY: string;
    RAPIDAPI_KEY: string;
    RAPIDAPI_HOST: string;
    CORESIGNAL_API_KEY: string;
    
    // Google APIs
    GOOGLE_JOBS_API_KEY: string;
    GOOGLE_GEOLOCATION_API_KEY: string;
    
    // AI Services
    OPENAI_API_KEY: string;
    ANTHROPIC_API_KEY?: string;
    GEMINI_API_KEY?: string;
    GROQ_API_KEY?: string;
    GROQ_MODEL?: string;
    
    // AWS S3
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    AWS_REGION?: string;
    S3_BUCKET_NAME?: string;
    
    // API URLs
    NEXT_PUBLIC_API_URL?: string;
    BACKEND_API_URL?: string;
    
    // Feature Flags
    NEXT_PUBLIC_MOCK_DATA?: string;
    NEXT_PUBLIC_DISABLE_AUTH?: string;
    
    // Debug
    DEBUG?: string;
    
    // Node Environment
    NODE_ENV: 'development' | 'production' | 'test';
    
    // Typesense Cloud Configuration
    TYPESENSE_HOST?: string;
    TYPESENSE_PORT?: string;
    TYPESENSE_PROTOCOL?: string;
    TYPESENSE_API_KEY?: string;
  }
}