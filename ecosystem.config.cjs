module.exports = {
  apps: [
    {
      name: 'jobportal',
      script: 'npm',
      args: 'start',
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
        NEXT_PUBLIC_SKIP_GOOGLE_FONTS: 'true'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=4096',
        NEXT_TELEMETRY_DISABLED: '1',
        NEXT_PUBLIC_SKIP_GOOGLE_FONTS: 'true'
      },
      // Logging configuration
      log_file: '/var/log/jobportal/combined.log',
      out_file: '/var/log/jobportal/out.log',
      error_file: '/var/log/jobportal/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 4000,
      
      // Health monitoring
      health_check_grace_period: 5000,
      health_check_interval: 30000,
      
      // Advanced features
      kill_timeout: 5000,
      listen_timeout: 15000,
      shutdown_with_message: true,
      
      // Memory and CPU monitoring
      max_memory_restart: '2G',
      node_args: '--max-old-space-size=4096',
      
      // Environment-specific settings
      exec_mode: 'fork',
      merge_logs: true,
      
      // Ensure proper startup
      wait_ready: true,
      listen_timeout: 20000,
      
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
      repo: 'https://github.com/anamsayyed58/jobportal',
      path: '/var/www/jobportal',
      'pre-deploy-local': '',
      'post-deploy': 'chmod +x scripts/universal-deploy.sh && ./scripts/universal-deploy.sh',
      'pre-setup': ''
    }
  }
};