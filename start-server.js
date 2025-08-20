#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.production' });

// Verify environment variables are loaded
console.log('🔍 Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing');

// Check if DATABASE_URL is missing
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env.production');
  console.error('Please check your environment configuration');
  process.exit(1);
}

// Start the Next.js standalone server
const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, '.next', 'standalone', 'server.js');

console.log('🚀 Starting Next.js standalone server...');
console.log('Server path:', serverPath);

const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
});
