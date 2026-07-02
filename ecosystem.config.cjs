// CRITICAL FIX: Load .env file BEFORE exporting config
const path = require('path');
const fs = require('fs');

// Try to load .env file if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    // Try to use dotenv if available
    try {
      require('dotenv').config({ path: envPath });
    } catch (dotenvError) {
      // If dotenv is not installed, manually parse .env file
      console.warn('⚠️ dotenv module not found, manually loading .env file...');
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      envLines.forEach(line => {
        const trimmedLine = line.trim();
        // Skip comments and empty lines
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const equalIndex = trimmedLine.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmedLine.substring(0, equalIndex).trim();
            const value = trimmedLine.substring(equalIndex + 1).trim();
            // Remove quotes if present
            const cleanValue = value.replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = cleanValue;
            }
          }
        }
      });
      console.log('✅ Manually loaded .env file');
    }
  } catch (err) {
    console.warn('⚠️ Could not load .env file:', err.message);
  }
}

// Do NOT append connection_limit/pool_timeout to DATABASE_URL — Prisma rejects those params.

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL is not set. Load .env or set env_file before starting PM2.');
}

// CRITICAL: Verify standalone server exists (preferred) or fallback to server.cjs
// This check happens at config load time, but we'll also verify at runtime
const standalonePath = path.join(__dirname, '.next', 'standalone', 'server.js');
const serverPath = path.join(__dirname, 'server.cjs');
const nextServerPath = path.join(__dirname, '.next', 'server');

// Determine which script to use (standalone preferred, fallback to server.cjs, then standard Next.js)
let scriptPath;
let scriptType = 'unknown';

if (fs.existsSync(standalonePath)) {
  scriptPath = standalonePath;
  scriptType = 'standalone';
  console.log('✅ Using standalone server:', standalonePath);
} else if (fs.existsSync(serverPath)) {
  scriptPath = serverPath;
  scriptType = 'server.cjs';
  console.log('⚠️  Standalone not found, using server.cjs:', serverPath);
} else if (fs.existsSync(nextServerPath)) {
  // Standard Next.js build - use next start
  scriptPath = 'node_modules/.bin/next';
  scriptType = 'next-start';
  console.log('⚠️  Using standard Next.js mode (next start)');
} else {
  console.error('❌ CRITICAL: No valid server found');
  console.error('   Standalone path:', standalonePath, fs.existsSync(standalonePath) ? '✅' : '❌');
  console.error('   Server.cjs path:', serverPath, fs.existsSync(serverPath) ? '✅' : '❌');
  console.error('   Next server path:', nextServerPath, fs.existsSync(nextServerPath) ? '✅' : '❌');
  console.error('   Current directory:', __dirname);
  console.error('   Run "npm run build" to generate standalone server.');
  // Use standalone path anyway (will fail but at least PM2 will start and show error)
  scriptPath = standalonePath;
  scriptType = 'standalone';
}

// Export script type for runtime verification
exports.scriptType = scriptType;

// Dedicated port for zero-downtime deploy health checks (not production :3000).
// Override with NAUKRIMILI_TEST_PORT env when starting naukrimili-test via PM2.
const NAUKRIMILI_TEST_PORT = parseInt(process.env.NAUKRIMILI_TEST_PORT || '13001', 10);

module.exports = {
  apps: [
    {
      name: "naukrimili",
      script: scriptPath,
      cwd: __dirname,
      // Add args for next start mode
      args: scriptType === 'next-start' ? 'start' : '',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
      env_file: ".env",
      wait_ready: false,
      listen_timeout: 60000,
      kill_timeout: 10000,
      shutdown_with_message: true,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        // Force DB queries enabled at runtime
        SKIP_BUILD_DB_QUERIES: "false",
        SKIP_DB_QUERIES: "false",
        SKIP_DB_VALIDATION: "false",
        // DATABASE_URL: loaded from env_file (.env) + dotenv above — do not hardcode here
        // Gmail OAuth2 API - Environment variables only
        GMAIL_API_CLIENT_ID: process.env.GMAIL_API_CLIENT_ID,
        GMAIL_API_CLIENT_SECRET: process.env.GMAIL_API_CLIENT_SECRET,
        GMAIL_API_REFRESH_TOKEN: process.env.GMAIL_API_REFRESH_TOKEN,
        GMAIL_SENDER: process.env.GMAIL_SENDER,
        GMAIL_FROM_NAME: process.env.GMAIL_FROM_NAME,
        // NextAuth Configuration - Load from environment
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "https://naukrimili.com",
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "naukrimili-secret-key-2024-production-deployment",
        // Canonical base URL - single source of truth
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://naukrimili.com",
        // Google OAuth removed - using manual registration only
        GITHUB_ID: process.env.GITHUB_ID,
        GITHUB_SECRET: process.env.GITHUB_SECRET,
        // AI / third-party keys — from .env only (never hardcode fallbacks)
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        AFFINDA_API_KEY: process.env.AFFINDA_API_KEY,
        AFFINDA_WORKSPACE_ID: process.env.AFFINDA_WORKSPACE_ID,
        APILAYER_API_KEY: process.env.APILAYER_API_KEY,
        EDEN_AI_API_KEY: process.env.EDEN_AI_API_KEY,
        EDEN_AI_RESUME_PROVIDERS: process.env.EDEN_AI_RESUME_PROVIDERS,
        GOOGLE_CLOUD_OCR_API_KEY: process.env.GOOGLE_CLOUD_OCR_API_KEY || process.env.GOOGLE_CLOUD_API_KEY,
        GOOGLE_CLOUD_API_KEY: process.env.GOOGLE_CLOUD_API_KEY,
        ABLY_API_KEY: process.env.ABLY_API_KEY,
        NEXT_PUBLIC_ABLY_API_KEY: process.env.NEXT_PUBLIC_ABLY_API_KEY,
        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
        RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        // Force DB queries enabled at runtime
        SKIP_BUILD_DB_QUERIES: "false",
        SKIP_DB_QUERIES: "false",
        SKIP_DB_VALIDATION: "false",
        // DATABASE_URL: loaded from env_file (.env) + dotenv above — do not hardcode here
        // Gmail OAuth2 API - Environment variables only
        GMAIL_API_CLIENT_ID: process.env.GMAIL_API_CLIENT_ID,
        GMAIL_API_CLIENT_SECRET: process.env.GMAIL_API_CLIENT_SECRET,
        GMAIL_API_REFRESH_TOKEN: process.env.GMAIL_API_REFRESH_TOKEN,
        GMAIL_SENDER: process.env.GMAIL_SENDER,
        GMAIL_FROM_NAME: process.env.GMAIL_FROM_NAME,
        // NextAuth — must match .env (do not hardcode; PM2 env_production overrides env_file)
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "https://naukrimili.com",
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "naukrimili-secret-key-2024-production-deployment",
        // Canonical base URL - single source of truth
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://naukrimili.com",
        // Google OAuth removed - using manual registration only
        GITHUB_ID: process.env.GITHUB_ID,
        GITHUB_SECRET: process.env.GITHUB_SECRET,
        // AI / third-party keys — from .env only (never hardcode fallbacks)
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        AFFINDA_API_KEY: process.env.AFFINDA_API_KEY,
        AFFINDA_WORKSPACE_ID: process.env.AFFINDA_WORKSPACE_ID,
        APILAYER_API_KEY: process.env.APILAYER_API_KEY,
        EDEN_AI_API_KEY: process.env.EDEN_AI_API_KEY,
        EDEN_AI_RESUME_PROVIDERS: process.env.EDEN_AI_RESUME_PROVIDERS,
        GOOGLE_CLOUD_OCR_API_KEY: process.env.GOOGLE_CLOUD_OCR_API_KEY || process.env.GOOGLE_CLOUD_API_KEY,
        GOOGLE_CLOUD_API_KEY: process.env.GOOGLE_CLOUD_API_KEY,
        ABLY_API_KEY: process.env.ABLY_API_KEY,
        NEXT_PUBLIC_ABLY_API_KEY: process.env.NEXT_PUBLIC_ABLY_API_KEY,
        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
        RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET
      },
      log_file: path.join(__dirname, "logs", "combined.log"),
      out_file: path.join(__dirname, "logs", "out.log"),
      error_file: path.join(__dirname, "logs", "error.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      log_type: "json",
      min_uptime: "10s",
      max_restarts: 5,
      restart_delay: 4000,
      exec_mode: "fork",
      ignore_watch: [
        "node_modules",
        ".next",
        "logs",
        "*.log",
        ".git"
      ]
    },
    {
      name: "naukrimili-test",
      script: scriptPath,
      cwd: __dirname,
      instances: 1,
      autorestart: false,
      watch: false,
      max_memory_restart: "2G",
      env_file: ".env",
      wait_ready: false,
      listen_timeout: 60000,
      kill_timeout: 10000,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
        PORT: NAUKRIMILI_TEST_PORT,
        HOSTNAME: "0.0.0.0",
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        SKIP_BUILD_DB_QUERIES: "false",
        SKIP_DB_QUERIES: "false",
        SKIP_DB_VALIDATION: "false",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "https://naukrimili.com",
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "naukrimili-secret-key-2024-production-deployment",
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://naukrimili.com",
      },
      log_file: path.join(__dirname, "logs", "test-combined.log"),
      out_file: path.join(__dirname, "logs", "test-out.log"),
      error_file: path.join(__dirname, "logs", "test-error.log"),
      merge_logs: true,
      log_type: "json",
    }
  ]
};