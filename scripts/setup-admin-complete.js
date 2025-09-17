#!/usr/bin/env node

/**
 * Complete Admin Setup Script
 * Creates admin user with password and verifies everything works
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupAdminComplete() {
  try {
    console.log('🔐 Setting up complete admin system...');
    
    // 1. Check if admin user exists
    let adminUser = await prisma.user.findUnique({
      where: { email: 'admin@jobportal.com' }
    });
    
    if (!adminUser) {
      console.log('📝 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@jobportal.com',
          name: 'System Admin',
          role: 'admin',
          password: hashedPassword,
          phone: '+91-9876543212',
          location: 'Delhi, NCR',
          bio: 'System administrator for the job portal',
          skills: ['System Administration', 'Database Management', 'Security'],
          experience: '10+ years in IT administration',
          education: 'M.Tech in Computer Science',
          isVerified: true,
          isActive: true
        }
      });
      console.log('✅ Admin user created successfully!');
    } else {
      console.log('👤 Admin user already exists, updating password...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      adminUser = await prisma.user.update({
        where: { email: 'admin@jobportal.com' },
        data: { password: hashedPassword }
      });
      console.log('✅ Admin password updated successfully!');
    }
    
    // 2. Verify admin user
    console.log('\n🔍 Verifying admin user...');
    const verifyUser = await prisma.user.findUnique({
      where: { email: 'admin@jobportal.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        password: true
      }
    });
    
    if (verifyUser) {
      console.log('✅ Admin user verification successful!');
      console.log(`📧 Email: ${verifyUser.email}`);
      console.log(`👤 Name: ${verifyUser.name}`);
      console.log(`🔑 Role: ${verifyUser.role}`);
      console.log(`✅ Active: ${verifyUser.isActive}`);
      console.log(`🔐 Has Password: ${!!verifyUser.password}`);
    } else {
      console.log('❌ Admin user verification failed!');
    }
    
    // 3. Test password verification
    console.log('\n🧪 Testing password verification...');
    const testPassword = await bcrypt.compare('admin123', verifyUser.password);
    console.log(`🔐 Password test: ${testPassword ? 'PASS' : 'FAIL'}`);
    
    console.log('\n🎉 Admin setup completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('📧 Email: admin@jobportal.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    console.log('\n🌐 Access URLs:');
    console.log('🔗 Login: /auth/signin');
    console.log('🔗 Admin Dashboard: /dashboard/admin');
    
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminComplete();
