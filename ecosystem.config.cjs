module.exports = {
  apps: [
    {
      name: 'jobportal',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Load environment variables from .env.local
        ...require('fs').readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            acc[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          }
          return acc;
        }, {})
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
