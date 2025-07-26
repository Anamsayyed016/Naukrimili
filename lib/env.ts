import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  // Database
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),
  DATABASE_URL: z.string().url('Invalid Database URL'),
  
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('Invalid NEXTAUTH_URL'),
  
  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  
  // AWS (Optional)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  
  // Google OAuth (Optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // App Settings
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEBUG: z.string().transform(val => val === 'true').optional(),
  
  // Backend API
  BACKEND_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment access
export type Env = z.infer<typeof envSchema>;

// Helper functions
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Security helpers
export function maskSensitiveValue(value: string): string {
  if (value.length <= 8) return '***';
  return value.slice(0, 4) + '***' + value.slice(-4);
}

export function getPublicEnvVars() {
  return {
    NODE_ENV: env.NODE_ENV,
    NEXTAUTH_URL: env.NEXTAUTH_URL,
    NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL,
  };
}