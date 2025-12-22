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

// Ensure DATABASE_URL has connection pooling parameters
function ensureDatabasePooling(dbUrl) {
  if (!dbUrl) return dbUrl;
  
  // Check if connection pooling parameters exist
  if (dbUrl.includes('connection_limit') || dbUrl.includes('pool_timeout')) {
    return dbUrl;
  }
  
  // Add connection pooling parameters
  const separator = dbUrl.includes('?') ? '&' : '?';
  return `${dbUrl}${separator}connection_limit=10&pool_timeout=20&connect_timeout=10&socket_timeout=30`;
}

// Fix DATABASE_URL if needed
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = ensureDatabasePooling(process.env.DATABASE_URL);
}

// Verify standalone server exists (preferred) or fallback to server.cjs
const standalonePath = path.join(__dirname, '.next', 'standalone', 'server.js');
const serverPath = path.join(__dirname, 'server.cjs');
if (!fs.existsSync(standalonePath) && !fs.existsSync(serverPath)) {
  console.error('❌ CRITICAL: Neither standalone server nor server.cjs found');
  console.error('   Standalone path:', standalonePath);
  console.error('   Server.cjs path:', serverPath);
  console.error('   Run "npm run build" to generate standalone server.');
}

module.exports = {
  apps: [
    {
      name: "naukrimili",
      script: path.join(__dirname, ".next", "standalone", "server.js"),
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
      env_file: ".env",
      // Zero-downtime deployment settings
      wait_ready: true,                    // Wait for 'ready' message before considering app online
      listen_timeout: 30000,               // 30 seconds to wait for ready message
      kill_timeout: 10000,                 // 10 seconds graceful shutdown timeout
      shutdown_with_message: true,         // Send shutdown message for graceful exit
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        // Database - NOW LOADED: dotenv loaded it above
        DATABASE_URL: ensureDatabasePooling(process.env.DATABASE_URL),
        // External Job APIs
        RAPIDAPI_KEY: "6817e0f996msh7e837aee4175f0cp1ab059jsn315ea7f0f041",
        ADZUNA_APP_ID: "5e478efa",
        ADZUNA_APP_KEY: "f216fb45f9e324783b04fd877fc0f4f7",
        JOOBLE_API_KEY: "10fd38f3-17ed-4718-8471-504f472b410a",
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
        // AI API Keys - Load from dotenv (with fallback to hardcoded for production)
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || "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",
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || "AIzaSyDKRwrHOm1k_fMvJIDqnihTgaT7Big8O_Y",
        GROQ_API_KEY: process.env.GROQ_API_KEY || "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",
        AFFINDA_API_KEY: process.env.AFFINDA_API_KEY || "aff_1b7dcbd1cee9731c46739fad896f5c02038d69e5",
        AFFINDA_WORKSPACE_ID: process.env.AFFINDA_WORKSPACE_ID || "cNmlyhQG",
        GOOGLE_CLOUD_OCR_API_KEY: process.env.GOOGLE_CLOUD_OCR_API_KEY || process.env.GOOGLE_CLOUD_API_KEY || "AIzaSyDKRwrHOm1k_fMvJIDqnihTgaT7Big8O_Y",
        GOOGLE_CLOUD_API_KEY: process.env.GOOGLE_CLOUD_API_KEY || "AIzaSyDKRwrHOm1k_fMvJIDqnihTgaT7Big8O_Y",
        ABLY_API_KEY: process.env.ABLY_API_KEY || "mWyTpQ.2PwcHg:aIlxSv2wrsenguDkxLRAd_czoZmajp-Kcc1WAusFOPU",
        NEXT_PUBLIC_ABLY_API_KEY: process.env.NEXT_PUBLIC_ABLY_API_KEY || "mWyTpQ.2PwcHg:aIlxSv2wrsenguDkxLRAd_czoZmajp-Kcc1WAusFOPU"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        // Database - NOW LOADED: dotenv loaded it above
        DATABASE_URL: ensureDatabasePooling(process.env.DATABASE_URL),
        // External Job APIs
        RAPIDAPI_KEY: "6817e0f996msh7e837aee4175f0cp1ab059jsn315ea7f0f041",
        ADZUNA_APP_ID: "5e478efa",
        ADZUNA_APP_KEY: "f216fb45f9e324783b04fd877fc0f4f7",
        JOOBLE_API_KEY: "10fd38f3-17ed-4718-8471-504f472b410a",
        // Gmail OAuth2 API - Environment variables only
        GMAIL_API_CLIENT_ID: process.env.GMAIL_API_CLIENT_ID,
        GMAIL_API_CLIENT_SECRET: process.env.GMAIL_API_CLIENT_SECRET,
        GMAIL_API_REFRESH_TOKEN: process.env.GMAIL_API_REFRESH_TOKEN,
        GMAIL_SENDER: process.env.GMAIL_SENDER,
        GMAIL_FROM_NAME: process.env.GMAIL_FROM_NAME,
        // NextAuth Configuration - Hardcoded for production
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "https://naukrimili.com",
        NEXTAUTH_SECRET: "naukrimili-secret-key-2024-production-deployment",
        // Canonical base URL - single source of truth
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://naukrimili.com",
        // Google OAuth removed - using manual registration only
        GITHUB_ID: process.env.GITHUB_ID,
        GITHUB_SECRET: process.env.GITHUB_SECRET,
        // AI API Keys - Load from environment with fallback to hardcoded values
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || "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",
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || "AIzaSyDKRwrHOm1k_fMvJIDqnihTgaT7Big8O_Y",
        GROQ_API_KEY: process.env.GROQ_API_KEY || "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",
        AFFINDA_API_KEY: process.env.AFFINDA_API_KEY || "aff_1b7dcbd1cee9731c46739fad896f5c02038d69e5",
        AFFINDA_WORKSPACE_ID: process.env.AFFINDA_WORKSPACE_ID || "cNmlyhQG",
        GOOGLE_CLOUD_OCR_API_KEY: process.env.GOOGLE_CLOUD_OCR_API_KEY || process.env.GOOGLE_CLOUD_API_KEY || "AIzaSyDKRwrHOm1k_fMvJIDqnihTgaT7Big8O_Y",
        GOOGLE_CLOUD_API_KEY: process.env.GOOGLE_CLOUD_API_KEY || "AIzaSyDKRwrHOm1k_fMvJIDqnihTgaT7Big8O_Y",
        ABLY_API_KEY: process.env.ABLY_API_KEY || "mWyTpQ.2PwcHg:aIlxSv2wrsenguDkxLRAd_czoZmajp-Kcc1WAusFOPU",
        NEXT_PUBLIC_ABLY_API_KEY: process.env.NEXT_PUBLIC_ABLY_API_KEY || "mWyTpQ.2PwcHg:aIlxSv2wrsenguDkxLRAd_czoZmajp-Kcc1WAusFOPU"
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
      // Zero-downtime deployment settings
      wait_ready: true,                    // Wait for 'ready' message before considering app online
      listen_timeout: 60000,               // 60 seconds to wait for ready message (Next.js + DB connections need time)
      kill_timeout: 10000,                 // 10 seconds graceful shutdown timeout
      shutdown_with_message: true,         // Send shutdown message for graceful exit
      ignore_watch: [
        "node_modules",
        ".next",
        "logs",
        "*.log",
        ".git"
      ]
    }
  ]
};