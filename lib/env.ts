import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().optional(),
  
  // Authentication
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  
  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // External Job APIs
  ADZUNA_APP_ID: z.string().optional(),
  ADZUNA_APP_KEY: z.string().optional(),
  RAPIDAPI_KEY: z.string().optional(),
  RAPIDAPI_HOST: z.string().optional(),
  JSEARCH_API_KEY: z.string().optional(),
  SERPAPI_KEY: z.string().optional(),
  
  // Google APIs
  GOOGLE_JOBS_API_KEY: z.string().optional(),
  GOOGLE_GEOLOCATION_API_KEY: z.string().optional(),
  
  // AI Services
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().optional(),
  
  // Google Cloud APIs
  GOOGLE_CLOUD_API_KEY: z.string().optional(),
  GOOGLE_CLOUD_OCR_API_KEY: z.string().optional(),
  GOOGLE_VISION_API_KEY: z.string().optional(),
  
  // File Storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Gmail OAuth2 API (for sending emails from info@naukrimili.com)
  GMAIL_API_CLIENT_ID: z.string().optional(),
  GMAIL_API_CLIENT_SECRET: z.string().optional(),
  GMAIL_API_REFRESH_TOKEN: z.string().optional(),
  GMAIL_SENDER: z.string().optional(),
  GMAIL_FROM_NAME: z.string().optional(),
  

  
  // Security
  ENCRYPTION_KEY: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  
  // Feature Flags
  NEXT_PUBLIC_MOCK_DATA: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_DISABLE_AUTH: z.string().transform(val => val === 'true').default('false'),
  AUTH_DISABLED: z.string().transform(val => val === 'true').default('false'),
  ENABLE_AI_FEATURES: z.string().transform(val => val === 'true').default('false'),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true'),
  
  // Typesense Cloud Configuration
  TYPESENSE_HOST: z.string().optional(),
  TYPESENSE_PORT: z.string().optional(),
  TYPESENSE_PROTOCOL: z.string().optional(),
  TYPESENSE_API_KEY: z.string().optional(),
  
  ENABLE_EMAIL_NOTIFICATIONS: z.string().transform(val => val === 'true').default('false'),
});

// Safe environment variable parsing - allows build to proceed even if some vars are missing
// This prevents build failures when optional env vars aren't set
let parsedEnv: z.infer<typeof envSchema>;
try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  // During build, allow missing env vars - they're all optional anyway
  // Just use empty defaults to allow build to proceed
  console.warn('⚠️ Environment validation failed during build, using defaults:', error instanceof Error ? error.message : 'Unknown error');
  parsedEnv = envSchema.parse({});
}
export const env = parsedEnv;

export type Env = z.infer<typeof envSchema>;
