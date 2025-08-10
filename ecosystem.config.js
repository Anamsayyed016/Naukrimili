/**
 * PM2 ecosystem config for NaukriMili on Hostinger
 * Usage: pm2 start ecosystem.config.js --only jobportal
 */
module.exports = {
  apps: [
    {
      name: 'jobportal',
      script: 'node',
      args: 'node_modules/next/dist/bin/next start -p 3000',
      cwd: process.env.APP_DIR || './',
      env: {
        NODE_ENV: 'production'
      },
      max_restarts: 5,
      autorestart: true,
      watch: false,
      max_memory_restart: '750M'
    }
  ]
};
