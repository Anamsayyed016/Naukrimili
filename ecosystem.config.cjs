module.exports = {
  apps: [
    {
      name: 'jobportal',
      script: 'server.js',
      cwd: '/var/www/jobportal',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=4096',
        NEXT_TELEMETRY_DISABLED: '1',
        NEXT_PUBLIC_SKIP_GOOGLE_FONTS: 'true',
        NEXT_PUBLIC_APP_URL: 'https://aftionix.in',
        AUTH_DISABLED: 'true',
        NEXT_PUBLIC_BYPASS_OAUTH: 'true',
        NEXTAUTH_URL: 'https://aftionix.in',
        NEXTAUTH_SECRET: 'jobportal-secret-key-2024-aftionix-production-deployment',
        JWT_SECRET: 'jobportal-jwt-secret-2024-aftionix-production',
        DATABASE_URL: 'postgresql://postgres:password@localhost:5432/jobportal',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=4096',
        NEXT_TELEMETRY_DISABLED: '1',
        NEXT_PUBLIC_SKIP_GOOGLE_FONTS: 'true',
        NEXT_PUBLIC_APP_URL: 'https://aftionix.in',
        AUTH_DISABLED: 'true',
        NEXT_PUBLIC_BYPASS_OAUTH: 'true',
        NEXTAUTH_URL: 'https://aftionix.in',
        NEXTAUTH_SECRET: 'jobportal-secret-key-2024-aftionix-production-deployment',
        JWT_SECRET: 'jobportal-jwt-secret-2024-aftionix-production',
        DATABASE_URL: 'postgresql://postgres:password@localhost:5432/jobportal',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
      },
      // Logging configuration
      log_file: '/var/log/jobportal/combined.log',
      out_file: '/var/log/jobportal/out.log',
      error_file: '/var/log/jobportal/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',
      
      // Process management
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 4000,
      
      // Memory and CPU monitoring
      max_memory_restart: '2G',
      node_args: '--max-old-space-size=4096',
      
      // Environment-specific settings
      exec_mode: 'fork',
      merge_logs: true,
      
      // Auto restart on file changes (disabled for production)
      watch: false,
      ignore_watch: [
        'node_modules',
        '.next',
        'logs',
        '*.log',
        '.git'
      ]
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'root',
      host: 'aftionix.in',
      ref: 'origin/main',
      repo: 'https://github.com/Anamsayyed016/Naukrimili',
      path: '/var/www/jobportal',
      'pre-deploy-local': '',
      'post-deploy': 'chmod +x scripts/universal-deploy.sh && ./scripts/universal-deploy.sh',
      'pre-setup': ''
    }
  }
};