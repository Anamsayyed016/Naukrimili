declare namespace NodeJS {
  ;
  interface ProcessEnv { // Database;
    MONGODB_URI: string;
    DATABASE_URL: string // Authentication;
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string // OpenAI;
    OPENAI_API_KEY: string // AWS S3;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    AWS_REGION?: string;
    S3_BUCKET_NAME?: string // API URLs;
    NEXT_PUBLIC_API_URL?: string;
    BACKEND_API_URL?: string // Debug;
    DEBUG?: string // Node Environment;
}
}
    NODE_ENV: 'development' | 'production' | 'test'}
}