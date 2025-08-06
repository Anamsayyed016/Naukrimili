#!/usr/bin/env node

const fs = require('fs');
const path = require('path');// Check environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {process.exit(1)}

const envContent = fs.readFileSync(envPath, 'utf8');
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_URL', 
  'NEXTAUTH_SECRET'
];let missingVars = [];

requiredEnvVars.forEach(varName => {
  if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your_`)) {} else {missingVars.push(varName)}
});

if (missingVars.length > 0) {}if (missingVars.length === 0) {} else {}
