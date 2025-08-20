#!/usr/bin/env node

/**
 * Security Migration Script
 * Runs the database migration to add security fields for OAuth users
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔒 Running Security Migration...\n');

try {
  // Check if migration file exists
  const migrationPath = path.join(process.cwd(), 'prisma/migrations/20250101000001_add_security_fields/migration.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.log('❌ Migration file not found!');
    console.log('   Expected: prisma/migrations/20250101000001_add_security_fields/migration.sql');
    process.exit(1);
  }
  
  console.log('✅ Migration file found');
  
  // Run the migration
  console.log('\n🚀 Applying security migration to database...');
  execSync('npx prisma migrate dev --name add_security_fields', { 
    stdio: 'inherit', 
    cwd: process.cwd() 
  });
  
  console.log('\n✅ Security migration completed successfully!');
  
  // Generate Prisma client with new schema
  console.log('\n🔧 Generating Prisma client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit', 
    cwd: process.cwd() 
  });
  
  console.log('\n🎉 Security setup complete!');
  console.log('\n📋 What was added:');
  console.log('   ✅ Security PIN field for OAuth users');
  console.log('   ✅ Two-factor authentication support');
  console.log('   ✅ Account lockout protection');
  console.log('   ✅ Login attempt tracking');
  console.log('   ✅ Security event logging');
  console.log('   ✅ Password reset token system');
  
  console.log('\n🚀 Next steps:');
  console.log('   1. Restart your development server');
  console.log('   2. Test OAuth authentication with PIN setup');
  console.log('   3. Verify security features are working');
  
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Ensure your database is running');
  console.log('   2. Check your DATABASE_URL in .env.local');
  console.log('   3. Verify you have write permissions to the database');
  process.exit(1);
}
