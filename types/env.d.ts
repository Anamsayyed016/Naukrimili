/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADZUNA_ID: string;
  readonly VITE_ADZUNA_KEY: string;
  // add more env vars as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 