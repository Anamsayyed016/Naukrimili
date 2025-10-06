module.exports = {
  apps: [
    {
      name: "jobportal",
      script: "server.cjs",
      cwd: process.cwd(),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_SKIP_GOOGLE_FONTS: "true",
        NEXT_PUBLIC_APP_URL: "https://aftionix.in",
        NEXTAUTH_URL: "https://aftionix.in",
        NEXTAUTH_SECRET: "jobportal-secret-key-2024-aftionix-production-deployment",
        JWT_SECRET: "jobportal-jwt-secret-2024-aftionix-production",
        DATABASE_URL: "postgresql://postgres:password@localhost:5432/jobportal"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_SKIP_GOOGLE_FONTS: "true",
        NEXT_PUBLIC_APP_URL: "https://aftionix.in",
        NEXTAUTH_URL: "https://aftionix.in",
        NEXTAUTH_SECRET: "jobportal-secret-key-2024-aftionix-production-deployment",
        JWT_SECRET: "jobportal-jwt-secret-2024-aftionix-production",
        DATABASE_URL: "postgresql://postgres:password@localhost:5432/jobportal"
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