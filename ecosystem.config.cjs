require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'jobportal',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Load all environment variables from .env
        ...process.env
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Load all environment variables from .env
        ...process.env
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10
    }
  ]
};
