// Minimal, dependency-free environment loader

type NodeEnv = 'development' | 'production' | 'test';

export interface Env {
  // App
  NODE_ENV: NodeEnv;
  DEBUG?: string;
  NEXT_PUBLIC_API_URL?: string;
  BACKEND_API_URL?: string;

  // Auth
  NEXTAUTH_SECRET?: string;
  NEXTAUTH_URL?: string;
  JWT_SECRET?: string;

  // DB
  MONGO_URI?: string;
  MONGODB_URI?: string;
  DATABASE_URL?: string;

  // OpenAI
  OPENAI_API_KEY?: string;

  // AWS
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  S3_BUCKET_NAME?: string;

  // Misc APIs
  SERPAPI_KEY?: string;
  RAPIDAPI_KEY?: string;
}

function toNodeEnv(value: string | undefined): NodeEnv {
  if (value === 'production' || value === 'test') return value;
  return 'development';
}

export const env: Env = {
  NODE_ENV: toNodeEnv(process.env.NODE_ENV),
  DEBUG: process.env.DEBUG,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  BACKEND_API_URL: process.env.BACKEND_API_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  MONGO_URI: process.env.MONGO_URI,
  MONGODB_URI: process.env.MONGODB_URI,
  DATABASE_URL: process.env.DATABASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  SERPAPI_KEY: process.env.SERPAPI_KEY,
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY,
};

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

export function maskSensitiveValue(value: string): string {
  if (!value) return '***';
  if (value.length <= 8) return '***';
  return value.slice(0, 4) + '***' + value.slice(-4);
}

export function getPublicEnvVars() {
  return {
    NODE_ENV: env.NODE_ENV,
    NEXTAUTH_URL: env.NEXTAUTH_URL,
    NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL,
  } as const;
}