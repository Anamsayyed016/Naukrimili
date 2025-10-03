module.exports = {
  apps: [
    {
      name: 'jobportal',
      script: 'npm',
      args: 'start',
      cwd: '/root/jobportal', // Update this to your actual project directory
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=4096',
        NEXT_TELEMETRY_DISABLED: '1'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=4096',
        NEXT_TELEMETRY_DISABLED: '1'
      },
      // Logging configuration
      log_file: '/var/log/jobportal/combined.log',
      out_file: '/var/log/jobportal/out.log',
      error_file: '/var/log/jobportal/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_interval: 30000,
      
      // Advanced features
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,
      
      // Memory and CPU monitoring
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=4096',
      
      // Environment-specific settings
      exec_mode: 'fork',
      merge_logs: true,
      
      // Ensure proper startup
      wait_ready: true,
      listen_timeout: 10000,
      
      // Auto restart on file changes (disabled for production)
      watch: false,
      ignore_watch: [
        'node_modules',
        '.next',
        'logs',
        '*.log'
      ]
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip', // Update with your server IP
      ref: 'origin/main',
      repo: 'your-git-repo-url', // Update with your Git repository URL
      path: '/root/jobportal',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --legacy-peer-deps --ignore-engines && npx prisma generate && npm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};