/**
 * PM2 ecosystem config for NaukriMili on Hostinger
 * Usage: pm2 start ecosystem.config.js --only jobportal
 */
module.exports = {
  apps: [
    {
      name: 'naukrimili-jobportal',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      // Production optimizations
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=4096',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      
      // Auto-restart settings
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.next'],
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Performance
      instances: 'max',
      exec_mode: 'cluster',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 8000,
      
      // Environment variables
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        NEXT_TELEMETRY_DISABLED: '1'
      }
    }
  ],
  
  deploy: {
    production: {
      user: 'your-username',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'your-git-repo-url',
      path: '/var/www/naukrimili',
      'post-deploy': 'npm install --production && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
