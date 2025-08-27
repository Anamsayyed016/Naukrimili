#!/usr/bin/env node

/**
 * Database Setup and Verification Script
 * This script helps set up and verify your database connection
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...\n');
  
  try {
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('\n📊 Existing tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes('DATABASE_URL')) {
      console.log('\n🔧 To fix this:');
      console.log('1. Copy env.template to .env.local');
      console.log('2. Update DATABASE_URL with your actual database credentials');
      console.log('3. Make sure your database is running');
    }
    
    return false;
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up database...\n');
  
  try {
    const { execSync } = require('child_process');
    
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Push schema to database
    console.log('\n🗄️ Pushing schema to database...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    console.log('\n✅ Database setup completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🏢 Job Portal Database Setup\n');
  console.log('This script will help you set up and verify your database connection.\n');
  
  // Check if .env.local exists
  const fs = require('fs');
  if (!fs.existsSync('.env.local')) {
    console.log('⚠️  .env.local file not found!');
    console.log('Please create .env.local with your database credentials first.\n');
    console.log('Steps:');
    console.log('1. Copy env.template to .env.local');
    console.log('2. Update DATABASE_URL with your actual database credentials');
    console.log('3. Make sure your database is running\n');
    
    rl.question('Press Enter to continue after creating .env.local...', () => {
      rl.close();
    });
    return;
  }
  
  // Check connection first
  const isConnected = await checkDatabaseConnection();
  
  if (!isConnected) {
    rl.question('\nWould you like to try setting up the database anyway? (y/N): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        await setupDatabase();
      }
      rl.close();
    });
    return;
  }
  
  // Ask if user wants to set up database
  rl.question('\nWould you like to set up the database schema? (y/N): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      await setupDatabase();
    }
    rl.close();
  });
}

main().catch(console.error);
