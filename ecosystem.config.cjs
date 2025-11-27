// CRITICAL FIX: Load .env file BEFORE exporting config
require('dotenv').config({ path: '.env' });

module.exports = {
  apps: [
    {
      name: "naukrimili",
      script: "server.cjs",
      cwd: process.cwd(),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
      env_file: ".env",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        // Database - NOW LOADED: dotenv loaded it above
        DATABASE_URL: process.env.DATABASE_URL,
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
        // Google OAuth - Load from environment
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GITHUB_ID: process.env.GITHUB_ID,
        GITHUB_SECRET: process.env.GITHUB_SECRET,
        // AI API Keys
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        ABLY_API_KEY: process.env.ABLY_API_KEY,
        NEXT_PUBLIC_ABLY_API_KEY: process.env.NEXT_PUBLIC_ABLY_API_KEY
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        // Database - NOW LOADED: dotenv loaded it above
        DATABASE_URL: process.env.DATABASE_URL,
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
        // Google OAuth - Load from environment
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GITHUB_ID: process.env.GITHUB_ID,
        GITHUB_SECRET: process.env.GITHUB_SECRET,
        // AI API Keys
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        ABLY_API_KEY: process.env.ABLY_API_KEY,
        NEXT_PUBLIC_ABLY_API_KEY: process.env.NEXT_PUBLIC_ABLY_API_KEY
      },
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      log_type: "json",
      min_uptime: "10s",
      max_restarts: 5,
      restart_delay: 4000,
      exec_mode: "fork",
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
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