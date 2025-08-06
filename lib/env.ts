import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  // Database
  MONGO_URI: z.string().optional(),
  MONGODB_URI: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  
  // NextAuth
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  
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
  
  // API Keys
  SERPAPI_KEY: z.string().optional(),
  RAPIDAPI_KEY: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  
  // Backend API
  BACKEND_API_URL: z.string().optional(),
  NEXT_PUBLIC_API_URL: z.string().optional(),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env)} catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = (error as z.ZodError).issues.map((issue: z.ZodIssue) => 
        `${issue.path.join('.')}: ${issue.message}`
      );
      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`)}
    throw error}
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
  return value.slice(0, 4) + '***' + value.slice(-4)}

export function getPublicEnvVars() {
  return {
    NODE_ENV: env.NODE_ENV,
    NEXTAUTH_URL: env.NEXTAUTH_URL,
    NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL,}}