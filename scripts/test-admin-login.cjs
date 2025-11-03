#!/usr/bin/env node

/**
 * Test Admin Login Script
 * Verifies admin password works correctly
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...\n');
    
    // Fetch admin user
    const user = await prisma.user.findUnique({
      where: { email: 'naukrimili@naukrimili.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        password: true
      }
    });
    
    if (!user) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log('📋 Admin User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Verified: ${user.isVerified}`);
    console.log(`   Has Password: ${!!user.password}\n`);
    
    // Test common passwords
    const testPasswords = [
      'naukrimili@123',
      'naukrimili123',
      'Naukrimili@123',
      'admin123',
      'Admin@123'
    ];
    
    console.log('🧪 Testing passwords...\n');
    
    for (const testPassword of testPasswords) {
      const isValid = await bcrypt.compare(testPassword, user.password);
      if (isValid) {
        console.log(`✅ PASSWORD FOUND: "${testPassword}"`);
        console.log(`\n🎉 Login Credentials:`);
        console.log(`   Email: naukrimili@naukrimili.com`);
        console.log(`   Password: ${testPassword}\n`);
        return;
      } else {
        console.log(`❌ Not: ${testPassword}`);
      }
    }
    
    console.log('\n⚠️  None of the test passwords matched!');
    console.log('🔧 You may need to reset the admin password.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminLogin();

