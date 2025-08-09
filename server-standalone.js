// Minimal standalone custom server (alternate entry). Prefer using server.js.
// Run with: node server-standalone.js
// Difference from server.js: no CORS / health logic, just raw Next handler.

const http = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT, 10) || 3000;
const hostname = process.env.HOSTNAME || 'localhost';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    const server = http.createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Standalone server request error', err);
        if (!res.headersSent) {
          res.statusCode = 500;
        }
        res.end('Internal Server Error');
      }
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });

    server.listen(port, () => {
      console.log(`> Standalone server ready on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start standalone server', err);
    process.exit(1);
  });

module.exports = { app };