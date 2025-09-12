module.exports = {
  apps: [
    {
      name: 'jobportal',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=2048'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=2048'
      },
      
      // Logging
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      
      // Process management
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      min_uptime: '10s',
      max_restarts: 5,
      
      // Performance optimizations
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Advanced options
      node_args: '--max-old-space-size=2048',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_interval: 30000
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'root',
      host: '69.62.73.84',
      ref: 'origin/main',
      repo: 'https://github.com/Anamsayyed016/Naukrimili.git',
      path: '/var/www/jobportal',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --only=production --legacy-peer-deps && npm run build:ultra-fast && pm2 reload ecosystem.optimized.cjs --env production',
      'pre-setup': ''
    }
  }
};
