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
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_SKIP_GOOGLE_FONTS: "true",
        NEXT_PUBLIC_APP_URL: "https://naukrimili.com",
        NEXTAUTH_URL: "https://naukrimili.com",
        NEXTAUTH_SECRET: "naukrimili-secret-key-2024-production-deployment",
        JWT_SECRET: "naukrimili-jwt-secret-2024-production",
        DATABASE_URL: "postgresql://postgres:password@localhost:5432/naukrimili"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_SKIP_GOOGLE_FONTS: "true",
        NEXT_PUBLIC_APP_URL: "https://naukrimili.com",
        NEXTAUTH_URL: "https://naukrimili.com",
        NEXTAUTH_SECRET: "naukrimili-secret-key-2024-production-deployment",
        JWT_SECRET: "naukrimili-jwt-secret-2024-production",
        DATABASE_URL: "postgresql://postgres:password@localhost:5432/naukrimili"
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
