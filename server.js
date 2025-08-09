// Clean custom Next.js server for Hostinger / local deployment
// Use only if you need custom HTTP handling (CORS headers, health check, etc.).
// The default package.json start script still uses `next start`. Add a new script to use this file if desired.

const http = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT, 10) || 3000;
// Hostname mainly used for Next 13+ to suppress warning when custom server proxies
const hostname = process.env.HOSTNAME || 'localhost';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    const server = http.createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);

        // Simple health endpoint (fast, no Next render)
        if (parsedUrl.pathname === '/health') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ status: 'ok', ts: Date.now() }));
        }

        // Basic CORS for API routes (adjust origin if needed)
        if (parsedUrl.pathname.startsWith('/api/')) {
          res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            return res.end();
          }
        }

        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Request error for', req.url, err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain');
        }
        res.end('Internal Server Error');
      }
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });

    server.listen(port, () => {
      console.log(`> Custom server ready on http://localhost:${port} (env: ${process.env.NODE_ENV})`);
    });

    const graceful = (signal) => {
      console.log(`Received ${signal}. Closing server...`);
      server.close(() => {
        console.log('Server closed. Exiting.');
        process.exit(0);
      });
      // Failsafe timeout
      setTimeout(() => {
        console.warn('Force exiting after timeout.');
        process.exit(1);
      }, 10000).unref();
    };
    process.on('SIGINT', () => graceful('SIGINT'));
    process.on('SIGTERM', () => graceful('SIGTERM'));
  })
  .catch((err) => {
    console.error('Failed to start Next.js app', err);
    process.exit(1);
  });

module.exports = { app }; // Optional export for testing