const fs = require('fs');
const path = require('path');

// Generate clean server.cjs
const serverContent = `const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(\`> Ready on http://\${hostname}:\${port}\`);
    });
});`;

// Write server.cjs
fs.writeFileSync('server.cjs', serverContent);
console.log('✅ server.cjs generated successfully');

// Generate ecosystem.config.cjs
const ecosystemContent = `module.exports = {
  apps: [
    {
      name: "jobportal",
      script: "server.cjs",
      cwd: "/var/www/jobportal",
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
        NEXT_PUBLIC_APP_URL: "https://naukrimili.com",
        NEXTAUTH_URL: "https://naukrimili.com",
        NEXTAUTH_SECRET: "jobportal-secret-key-2024-naukrimili-production-deployment",
        JWT_SECRET: "jobportal-jwt-secret-2024-naukrimili-production",
        DATABASE_URL: "postgresql://postgres:password@localhost:5432/jobportal",
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_SKIP_GOOGLE_FONTS: "true",
        NEXT_PUBLIC_APP_URL: "https://naukrimili.com",
        NEXTAUTH_URL: "https://naukrimili.com",
        NEXTAUTH_SECRET: "jobportal-secret-key-2024-naukrimili-production-deployment",
        JWT_SECRET: "jobportal-jwt-secret-2024-naukrimili-production",
        DATABASE_URL: "postgresql://postgres:password@localhost:5432/jobportal",
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
      },
      log_file: "/var/log/jobportal/combined.log",
      out_file: "/var/log/jobportal/out.log",
      error_file: "/var/log/jobportal/error.log",
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
};`;

// Write ecosystem.config.cjs
fs.writeFileSync('ecosystem.config.cjs', ecosystemContent);
console.log('✅ ecosystem.config.cjs generated successfully');

// Generate .env file
const envContent = `DATABASE_URL="postgresql://postgres:password@localhost:5432/jobportal"
NEXTAUTH_URL="https://naukrimili.com"
NEXTAUTH_SECRET="jobportal-secret-key-2024-naukrimili-production-deployment"
JWT_SECRET="jobportal-jwt-secret-2024-naukrimili-production"
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_URL=https://naukrimili.com
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET`;

// Write .env
fs.writeFileSync('.env', envContent);
console.log('✅ .env generated successfully');

console.log('🎉 All server files generated successfully!');
